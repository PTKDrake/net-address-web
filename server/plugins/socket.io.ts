import type { NitroApp } from "nitropack";
import { Server as Engine } from 'engine.io';
import { Server } from 'socket.io';
import { defineEventHandler } from "h3";
import { useDrizzle } from '~~/server/utils/drizzle';
import { devices } from '~~/db/deviceSchema';
import { eq, and } from 'drizzle-orm';

// Singleton instance for Socket.IO server
let ioInstance: Server | null = null;

// Function to get the Socket.IO instance
export const getSocketIOInstance = () => {
    return ioInstance;
};

// Function to broadcast device updates to all connected clients
export const broadcastDeviceUpdate = async (macAddress: string) => {
    if (!ioInstance) {
        console.warn('Socket.IO instance not available for broadcasting device update');
        return;
    }

    try {
        console.log(`Broadcasting update for device with MAC: ${macAddress}`);

        // Get the updated device from the database
        const device = await useDrizzle()
            .select()
            .from(devices)
            .where(eq(devices.macAddress, macAddress))
            .then(results => results[0]);

        if (device) {
            console.log('Device found, broadcasting update:', device);

            // Format dates for proper serialization
            const formattedDevice = {
                ...device,
                lastSeen: device.lastSeen ? device.lastSeen.toISOString() : null
            };

            // Broadcast the updated device to all connected clients
            ioInstance.emit('device-update', formattedDevice);
            console.log('Broadcast complete');
        } else {
            console.warn(`No device found with MAC: ${macAddress}`);
        }
    } catch (error) {
        console.error('Error broadcasting device update:', error);
    }
};

// Function to broadcast device disconnection to all connected clients
export const broadcastDeviceDisconnect = async (macAddress: string) => {
    if (!ioInstance) {
        console.warn('Socket.IO instance not available for broadcasting device disconnect');
        return;
    }

    try {
        console.log(`Broadcasting disconnect for device with MAC: ${macAddress}`);

        // Get device name for logging
        const device = await useDrizzle()
            .select({ name: devices.name })
            .from(devices)
            .where(eq(devices.macAddress, macAddress))
            .then(results => results[0]);

        // Broadcast the device disconnection to all connected clients
        ioInstance.emit('device-disconnect', macAddress);

        console.log(`Broadcast disconnect complete for device: ${device?.name || 'unknown'} (${macAddress})`);
    } catch (error) {
        console.error('Error broadcasting device disconnect:', error);
        // Still try to broadcast even if we couldn't get the device name
        ioInstance.emit('device-disconnect', macAddress);
    }
};

// Function to broadcast device shutdown to all connected clients
export const broadcastDeviceShutdown = async (macAddress: string) => {
    if (!ioInstance) {
        console.warn('Socket.IO instance not available for broadcasting device shutdown');
        return;
    }

    try {
        console.log(`Broadcasting shutdown for device with MAC: ${macAddress}`);

        // Get device name for logging
        const device = await useDrizzle()
            .select({ name: devices.name })
            .from(devices)
            .where(eq(devices.macAddress, macAddress))
            .then(results => results[0]);

        // Broadcast the device shutdown to all connected clients
        ioInstance.emit('device-shutdown', macAddress);

        console.log(`Broadcast shutdown complete for device: ${device?.name || 'unknown'} (${macAddress})`);
    } catch (error) {
        console.error('Error broadcasting device shutdown:', error);
        // Still try to broadcast even if we couldn't get the device name
        ioInstance.emit('device-shutdown', macAddress);
    }
};

// Map to store socket connections by userId and macAddress
const connectedDevices = new Map<string, Map<string, string>>();

export default defineNitroPlugin((nitroApp: NitroApp) => {
    const engine = new Engine();
    const io = new Server();
    // Set the singleton instance
    ioInstance = io;
    const db = useDrizzle();

    io.bind(engine);

    io.on('connection', (socket) => {
        console.log('New connection', socket.id);

        // Authenticate device when connecting
        socket.on('register-device', async (data: { userId: string, macAddress: string, ipAddress: string, }) => {
            try {
                const { userId, macAddress, ipAddress } = data;

                // Update device information in database
                await db
                    .update(devices)
                    .set({
                        ipAddress,
                        macAddress,
                        lastSeen: new Date(),
                        isConnected: true
                    })
                    .where(and(eq(devices.macAddress, macAddress), eq(devices.userId, userId)));

                // Broadcast device update to all clients
                await broadcastDeviceUpdate(macAddress);

                // Save mapping of socket.id with userId and macAddress
                if (!connectedDevices.has(userId)) {
                    connectedDevices.set(userId, new Map());
                }
                connectedDevices.get(userId)?.set(macAddress, socket.id);

                // Join room by userId and macAddress for easy notification sending
                socket.join(`user:${userId}`);
                socket.join(`device:${macAddress}`);

                console.log(`Device registered: User ${userId}, Device ${macAddress}`);

                // Return success notification
                socket.emit('register-success', { macAddress });
            } catch (error) {
                console.error('Error registering device:', error);
                socket.emit('register-error', { message: 'Cannot register device' });
            }
        });

        // Event to receive shutdown command from client
        socket.on('shutdown-request', async (data: { userId: string, macAddress: string }) => {
            const { userId, macAddress } = data;

            // Check if device is currently connected
            const userDevices = connectedDevices.get(userId);
            const targetSocketId = userDevices?.get(macAddress);

            if (targetSocketId) {
                // Send shutdown command to specific device
                io.to(targetSocketId).emit('shutdown-command', { macAddress });

                // Update status in DB
                await db
                    .update(devices)
                    .set({ isConnected: false })
                    .where(and(eq(devices.macAddress, macAddress), eq(devices.userId, userId)));

                // Get the device to find its macAddress
                const device = await db
                    .select()
                    .from(devices)
                    .where(and(eq(devices.macAddress, macAddress), eq(devices.userId, userId)))
                    .then(results => results[0]);

                if (device) {
                    // Broadcast device shutdown to all clients
                    broadcastDeviceShutdown(device.macAddress);
                }

                socket.emit('shutdown-response', { 
                    success: true, 
                    macAddress,
                    message: 'Shutdown command sent successfully' 
                });
            } else {
                socket.emit('shutdown-response', { 
                    success: false, 
                    macAddress,
                    message: 'Device is not connected' 
                });
            }
        });

        // Handle when device disconnects
        socket.on('disconnect', async () => {
            console.log('Disconnected:', socket.id);

            // Find and remove device from connectedDevices map
            for (const [userId, userDevices] of connectedDevices.entries()) {
                for (const [macAddress, socketId] of userDevices.entries()) {
                    if (socketId === socket.id) {
                        userDevices.delete(macAddress);

                        // Update status in DB
                        await db
                            .update(devices)
                            .set({ isConnected: false })
                            .where(and(eq(devices.macAddress, macAddress), eq(devices.userId, userId)));

                        // Get the device to find its macAddress
                        const device = await db
                            .select()
                            .from(devices)
                            .where(and(eq(devices.macAddress, macAddress), eq(devices.userId, userId)))
                            .then(results => results[0]);

                        if (device) {
                            // Broadcast device disconnection to all clients
                            broadcastDeviceDisconnect(device.macAddress);
                        }

                        console.log(`Device ${macAddress} of user ${userId} disconnected`);

                        // If user has no more devices, remove user from map
                        if (userDevices.size === 0) {
                            connectedDevices.delete(userId);
                        }
                        break;
                    }
                }
            }
        });
    });

    nitroApp.router.use("/socket.io/", defineEventHandler({
        handler(event) {
            engine.handleRequest(event.node.req as any, event.node.res);
            event._handled = true;
        },
        websocket: {
            open(peer) {
                // @ts-expect-error private method and property
                engine.prepare(peer._internal.nodeReq);
                // @ts-expect-error private method and property
                engine.onWebSocket(peer._internal.nodeReq, peer._internal.nodeReq.socket, peer.websocket);
            }
        }
    }));
});
