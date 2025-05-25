import type {Peer} from "crossws";
import {devices} from "~~/db/deviceSchema";
import {eq} from "drizzle-orm";
import { broadcastDeviceUpdate, broadcastDeviceDisconnect, broadcastDeviceShutdown, syncWebSocketConnection } from '~~/server/plugins/socket.io';
import { WebSocketMessageValidator } from './websocket/validators';

// WebSocket handler for device connections (computers/hardware)
// Note: This is different from Socket.IO which handles web client connections
const computerConnections = new Map<string, Peer>();
const messageValidator = new WebSocketMessageValidator(computerConnections);

// Export function to get computer connections for Socket.IO bridge
export const getComputerConnections = () => {
    return computerConnections;
};

// Function to send shutdown command to a specific device via WebSocket
export const sendShutdownCommand = (deviceId: string): boolean => {
    console.log(`🔌 Attempting to send shutdown command via WebSocket to: ${deviceId}`);
    
    const peer = computerConnections.get(deviceId);
    if (!peer) {
        console.error(`❌ No WebSocket connection found for device: ${deviceId}`);
        console.log(`📊 Available WebSocket connections:`, Array.from(computerConnections.keys()));
        return false;
    }

    try {
        console.log(`📡 Sending shutdown command to device: ${deviceId}`);
        peer.send(JSON.stringify({
            messageType: "command",
            message: "shutdown"
        }));
        console.log(`✅ Shutdown command sent successfully to: ${deviceId}`);
        return true;
    } catch (error) {
        console.error(`❌ Error sending shutdown command to device ${deviceId}:`, error);
        return false;
    }
};

// WebSocket handler for device connections
export default defineWebSocketHandler({
    open(peer) {
        console.log('🔗 WebSocket connection opened');
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

            console.log(`📨 Received WebSocket message type: ${data.messageType || 'unknown'}`);
            
            // Use the new validator to process the message
            await messageValidator.validateAndProcess(data, peer);
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
            peer.send(JSON.stringify({messageType: "error", message: "Server error processing message"}));
        }
    },
    async close(peer) {
        console.log('❌ WebSocket connection closed');

        try {
            let disconnectedDevices = 0;

            for (const [macAddress, connection] of computerConnections.entries()) {
                if (connection === peer) {
                    console.log(`🔌 Device disconnected via WebSocket: ${macAddress}`);

                    // Remove from connections map
                    computerConnections.delete(macAddress);

                    // Update device status in database
                    await useDrizzle().update(devices).set({
                        isConnected: false,
                        lastSeen: new Date() // Update last seen time
                    }).where(eq(devices.macAddress, macAddress));

                    // Sync with Socket.IO clients (this will handle the broadcast)
                    console.log(`🔄 Syncing WebSocket disconnect: ${macAddress}`);
                    syncWebSocketConnection(macAddress, false);

                    disconnectedDevices++;
                }
            }

            console.log(`✅ Processed ${disconnectedDevices} WebSocket device disconnections`);
        } catch (error) {
            console.error('❌ Error handling WebSocket close:', error);
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

                    // Sync with Socket.IO clients (this will handle the broadcast)
                    syncWebSocketConnection(macAddress, false);

                    disconnectedDevices++;
                }
            }

            console.log(`Processed ${disconnectedDevices} device disconnections due to errors`);
        } catch (err) {
            console.error('Error handling WebSocket error event:', err);
        }
    }
});
