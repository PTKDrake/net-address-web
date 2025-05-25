import type {Peer} from "crossws";
import {devices} from "~~/db/deviceSchema";
import {eq} from "drizzle-orm";
import { broadcastDeviceUpdate, broadcastDeviceDisconnect, broadcastDeviceShutdown } from '~~/server/plugins/socket.io';
import { WebSocketMessageValidator } from './websocket/validators';

const computerConnections = new Map<string, Peer>();
const messageValidator = new WebSocketMessageValidator(computerConnections);


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
            const data = message.json() as any;
            if (!data) {
                console.warn('Received invalid message format');
                peer.send(JSON.stringify({messageType: "error", message: "Invalid message"}));
                return;
            }

            console.log(`Received message of type: ${data.messageType || 'unknown'}`);
            
            // Use the new validator to process the message
            await messageValidator.validateAndProcess(data, peer);
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
