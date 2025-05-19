import type {Peer} from "crossws";
import {devices} from "~~/db/deviceSchema";
import {eq} from "drizzle-orm";
import { broadcastDeviceUpdate, broadcastDeviceDisconnect, broadcastDeviceShutdown } from '~~/server/plugins/socket.io';

const computerConnections = new Map<string, Peer>();

type RegisterMachine = {
    messageType: "register",
    userId?: string,
    machineName: string,
    ipAddress: string,
    macAddress: string
};
type UpdateMachine = { messageType: "update", machineName: string, ipAddress: string, macAddress: string };
type DisconnectMachine = { messageType: "disconnect", macAddress: string };
type ShutdownMachine = { messageType: "shutdown", macAddress: string };
type Message = RegisterMachine | UpdateMachine | DisconnectMachine | ShutdownMachine;

// Function to send shutdown command to a specific device
export const sendShutdownCommand = (deviceId: string): boolean => {
    const peer = computerConnections.get(deviceId);
    if (!peer) {
        console.error(`No connection found for device ${deviceId}`);
        return false;
    }

    try {
        peer.send({
            messageType: "command",
            message: "shutdown",
        });
        return true;
    } catch (error) {
        console.error(`Error sending shutdown command to device ${deviceId}:`, error);
        return false;
    }
};

export default defineWebSocketHandler({
    open(peer) {
        console.log('WebSocket connection opened');
        peer.send(JSON.stringify({messageType: "info", message: "WS Connected"}));
    },
    async message(peer, message) {
        try {
            const data = message.json<Message>();
            if (!data) {
                console.warn('Received invalid message format');
                peer.send(JSON.stringify({messageType: "error", message: "Invalid message"}));
                return;
            }

            console.log(`Received message of type: ${data.messageType}`);

            if (data.messageType === "register") {
                const {userId, machineName, ipAddress, macAddress} = data;
                console.log(`Device registration/update request: ${machineName} (${macAddress})`);

                const list = await useDrizzle().select({macAddress: devices.macAddress, isConnected: devices.isConnected}).from(devices).where(eq(devices.macAddress, macAddress)).limit(1);
                if (list.length > 0) {
                    console.log(`Device already registered: ${machineName} (${macAddress}), updating info`);

                    await useDrizzle().update(devices).set({
                        name: machineName,
                        ipAddress: ipAddress,
                        lastSeen: new Date(),
                        isConnected: true,
                    }).where(eq(devices.macAddress, macAddress));

                    peer.send(JSON.stringify({messageType: "info", message: list[0].isConnected ? "updated" : "connected"}));

                    if(!computerConnections.has(macAddress)) {
                        console.log(`Adding device to connections map: ${machineName} (${macAddress})`);
                        computerConnections.set(macAddress, peer);
                    }
                } else {
                    // Only proceed with registration if userId is provided
                    if (!userId) {
                        console.warn(`Cannot register new device without userId: ${machineName} (${macAddress})`);
                        peer.send(JSON.stringify({messageType: "error", message: "userId required for new device registration"}));
                        return;
                    }

                    console.log(`Registering new device: ${machineName} (${macAddress})`);

                    await useDrizzle().insert(devices).values({
                        userId: userId,
                        ipAddress: ipAddress,
                        macAddress: macAddress,
                        name: machineName,
                        isConnected: true,
                    });

                    computerConnections.set(macAddress, peer);
                    peer.send(JSON.stringify({messageType: "info", message: "registered"}));
                }

                // Broadcast device update to all clients
                console.log(`Broadcasting device update: ${machineName} (${macAddress})`);
                await broadcastDeviceUpdate(macAddress);

            } else if (data.messageType === "update") {
                // For backward compatibility, treat "update" messages as "register" messages
                const {machineName, ipAddress, macAddress} = data;
                console.log(`Legacy device update request: ${machineName} (${macAddress}), redirecting to register handler`);

                // Update device info
                await useDrizzle().update(devices).set({
                    name: machineName,
                    ipAddress: ipAddress,
                    lastSeen: new Date(),
                    isConnected: true,
                }).where(eq(devices.macAddress, macAddress));

                peer.send(JSON.stringify({messageType: "info", message: "Updated"}));

                // Broadcast device update to all clients
                console.log(`Broadcasting device update: ${machineName} (${macAddress})`);
                await broadcastDeviceUpdate(macAddress);

            } else if (data.messageType === "disconnect") {
                const {macAddress} = data;
                console.log(`Device disconnect request: ${macAddress}`);

                await useDrizzle().update(devices).set({
                    isConnected: false,
                }).where(eq(devices.macAddress, macAddress));

                computerConnections.delete(macAddress);
                peer.send(JSON.stringify({messageType: "info", message: "disconnected"}));

                // Broadcast device disconnection to all clients
                console.log(`Broadcasting device disconnect: ${macAddress}`);
                await broadcastDeviceDisconnect(macAddress);

            } else if (data.messageType === "shutdown") {
                const {macAddress} = data;
                console.log(`Device shutdown notification: ${macAddress}`);

                // Update device status in database
                await useDrizzle().update(devices).set({
                    isConnected: false,
                }).where(eq(devices.macAddress, macAddress));

                // Remove from connections map
                computerConnections.delete(macAddress);

                // Broadcast device shutdown to all clients
                console.log(`Broadcasting device shutdown: ${macAddress}`);
                await broadcastDeviceShutdown(macAddress);
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
            peer.send(JSON.stringify({messageType: "error", message: "Server error processing message"}));
        }
    },
    async close(peer) {
        console.log('WebSocket connection closed');

        try {
            let disconnectedDevices = 0;

            for (const [macAddress, connection] of computerConnections.entries()) {
                if (connection === peer) {
                    console.log(`Device disconnected: ${macAddress}`);

                    // Remove from connections map
                    computerConnections.delete(macAddress);

                    // Update device status in database
                    await useDrizzle().update(devices).set({
                        isConnected: false,
                        lastSeen: new Date() // Update last seen time
                    }).where(eq(devices.macAddress, macAddress));

                    // Broadcast device disconnection to all clients
                    await broadcastDeviceDisconnect(macAddress);

                    disconnectedDevices++;
                }
            }

            console.log(`Processed ${disconnectedDevices} device disconnections`);
        } catch (error) {
            console.error('Error handling WebSocket close:', error);
        }
    },
    async error(peer, error) {
        console.error("WebSocket error:", error);

        try {
            let disconnectedDevices = 0;

            for (const [macAddress, connection] of computerConnections.entries()) {
                if (connection === peer) {
                    console.log(`Device connection error: ${macAddress}`);

                    // Remove from connections map
                    computerConnections.delete(macAddress);

                    // Update device status in database
                    await useDrizzle().update(devices).set({
                        isConnected: false,
                        lastSeen: new Date() // Update last seen time
                    }).where(eq(devices.macAddress, macAddress));

                    // Broadcast device disconnection to all clients
                    await broadcastDeviceDisconnect(macAddress);

                    disconnectedDevices++;
                }
            }

            console.log(`Processed ${disconnectedDevices} device disconnections due to errors`);
        } catch (err) {
            console.error('Error handling WebSocket error event:', err);
        }
    }
});
