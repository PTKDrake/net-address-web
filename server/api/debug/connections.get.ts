import { getComputerConnections } from '../websocket';
import { getSocketIOInstance } from '../../plugins/socket.io';
import { devices } from '~~/db/deviceSchema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  try {
    // Get WebSocket connections
    const webSocketConnections = getComputerConnections();
    
    // Get Socket.IO connections
    const socketIO = getSocketIOInstance();
    const socketIOConnections = socketIO ? socketIO.sockets.adapter.rooms : new Map();
    
    // Get device data from database
    const connectedDevices = await useDrizzle()
      .select()
      .from(devices)
      .where(eq(devices.isConnected, true));

    return {
      timestamp: new Date().toISOString(),
      webSocket: {
        total: webSocketConnections.size,
        devices: Array.from(webSocketConnections.keys())
      },
      socketIO: {
        total: socketIO?.engine.clientsCount || 0,
        rooms: Array.from(socketIOConnections.keys()).filter(room => 
          room.startsWith('device:') || room.startsWith('user:')
        )
      },
      database: {
        connectedDevices: connectedDevices.length,
        devices: connectedDevices.map((d: any) => ({
          name: d.name,
          macAddress: d.macAddress,
          ipAddress: d.ipAddress,
          lastSeen: d.lastSeen
        }))
      }
    };
  } catch (error) {
    console.error('Error getting connection debug info:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get connection info'
    });
  }
}); 