import type { NitroApp } from "nitropack";
import { Server as Engine } from 'engine.io';
import { Server } from 'socket.io';
import { defineEventHandler } from "h3";
import { useDrizzle } from '~~/server/utils/drizzle';
import { devices } from '~~/db/deviceSchema';
import { user } from '~~/db/authSchema';
import { eq, and } from 'drizzle-orm';
import { sendShutdownCommand as sendWebSocketShutdownCommand } from '~~/server/api/websocket';

// Singleton Socket.IO instance
let ioInstance: Server | null = null;

// Get Socket.IO instance
export const getSocketIOInstance = () => ioInstance;

// Bridge to sync WebSocket connections with Socket.IO
export const syncWebSocketConnection = (macAddress: string, isConnected: boolean, eventType: 'disconnect' | 'shutdown' = 'disconnect') => {
  console.log(`🔄 Syncing WebSocket: ${macAddress} - ${isConnected ? 'connected' : eventType}`);
  
  if (!ioInstance) {
    console.warn('⚠️ Socket.IO not available for sync');
    return;
  }

  if (isConnected) {
    console.log(`📤 Scheduling device update broadcast for: ${macAddress}`);
    setImmediate(() => broadcastDeviceUpdate(macAddress));
  } else {
    if (eventType === 'shutdown') {
      console.log(`📤 Scheduling shutdown broadcast for: ${macAddress}`);
      setImmediate(() => broadcastDeviceShutdown(macAddress));
    } else {
      console.log(`📤 Scheduling disconnect broadcast for: ${macAddress}`);
      setImmediate(() => broadcastDeviceDisconnect(macAddress));
    }
  }
};

// Get active WebSocket devices
export const getWebSocketDevices = async (): Promise<string[]> => {
  try {
    const { getComputerConnections } = await import('~~/server/api/websocket');
    return Array.from(getComputerConnections().keys());
  } catch (error) {
    console.error('❌ Error getting WebSocket devices:', error);
    return [];
  }
};

// Broadcast device update to all clients
export const broadcastDeviceUpdate = async (macAddress: string) => {
  if (!ioInstance) {
    console.warn('⚠️ Socket.IO not available for broadcast');
    return;
  }

  try {
    const device = await useDrizzle()
      .select({
        macAddress: devices.macAddress,
        name: devices.name,
        ipAddress: devices.ipAddress,
        isConnected: devices.isConnected,
        lastSeen: devices.lastSeen,
        hardware: devices.hardware,
        userId: devices.userId,
        userName: user.name,
        userEmail: user.email,
        createdAt: devices.createdAt,
        updatedAt: devices.updatedAt
      })
      .from(devices)
      .leftJoin(user, eq(devices.userId, user.id))
      .where(eq(devices.macAddress, macAddress))
      .then(results => results[0]);

    if (!device) {
      console.warn(`❌ Device not found: ${macAddress}`);
      return;
    }

    const formattedDevice = {
      ...device,
      lastSeen: device.lastSeen ? device.lastSeen.toISOString() : null
    };

    // Get all connected clients and check their permissions
    const sockets = await ioInstance.fetchSockets();
    
    for (const socket of sockets) {
      const socketUserId = socket.data.userId;
      const isAdmin = socket.data.isAdmin || false;
      
      // Send to device owner or admin
      if (socketUserId && (device.userId === socketUserId || isAdmin)) {
        socket.emit('device-update', formattedDevice);
      }
    }

    console.log(`✅ Targeted broadcast complete: ${device.name}`);
  } catch (error) {
    console.error('❌ Error broadcasting update:', error);
  }
};

// Broadcast device disconnection to authorized clients only
export const broadcastDeviceDisconnect = async (macAddress: string) => {
  if (!ioInstance) {
    console.warn('⚠️ Socket.IO not available for broadcast');
    return;
  }

  try {
    // Get device owner info
    const device = await useDrizzle()
      .select({ userId: devices.userId })
      .from(devices)
      .where(eq(devices.macAddress, macAddress))
      .then(results => results[0]);

    if (!device) {
      console.warn(`❌ Device not found for disconnect: ${macAddress}`);
      return;
    }

    // Get all connected clients and check their permissions
    const sockets = await ioInstance.fetchSockets();
    
    for (const socket of sockets) {
      const socketUserId = socket.data.userId;
      const isAdmin = socket.data.isAdmin || false;
      
      // Send to device owner or admin
      if (socketUserId && (device.userId === socketUserId || isAdmin)) {
        socket.emit('device-disconnect', macAddress);
      }
    }

    console.log(`✅ Targeted disconnect broadcast complete: ${macAddress}`);
  } catch (error) {
    console.error('❌ Error broadcasting disconnect:', error);
  }
};

// Broadcast device shutdown to authorized clients only
export const broadcastDeviceShutdown = async (macAddress: string) => {
  if (!ioInstance) {
    console.warn('⚠️ Socket.IO not available for broadcast');
    return;
  }

  try {
    // Get device owner info
    const device = await useDrizzle()
      .select({ userId: devices.userId })
      .from(devices)
      .where(eq(devices.macAddress, macAddress))
      .then(results => results[0]);

    if (!device) {
      console.warn(`❌ Device not found for shutdown: ${macAddress}`);
      return;
    }

    // Get all connected clients and check their permissions
    const sockets = await ioInstance.fetchSockets();
    
    for (const socket of sockets) {
      const socketUserId = socket.data.userId;
      const isAdmin = socket.data.isAdmin || false;
      
      // Send to device owner or admin
      if (socketUserId && (device.userId === socketUserId || isAdmin)) {
        socket.emit('device-shutdown', macAddress);
      }
    }

    console.log(`✅ Targeted shutdown broadcast complete: ${macAddress}`);
  } catch (error) {
    console.error('❌ Error broadcasting shutdown:', error);
  }
};

// Map to store socket connections by userId and macAddress
const connectedDevices = new Map<string, Map<string, string>>();

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const engine = new Engine();
  const io = new Server({
    pingTimeout: 10000,
    pingInterval: 5000,
    upgradeTimeout: 5000,
    allowUpgrades: true,
    transports: ['websocket', 'polling'],
    allowEIO3: true
  });
  
  ioInstance = io;
  const db = useDrizzle();

  io.bind(engine);

  io.on('connection', (socket) => {
    console.log('🔌 New Socket.IO client:', socket.id);

    // Store user session info in socket
    socket.on('auth', async (data: { userId: string; userRole?: string }) => {
      const { userId, userRole } = data;
      
      // Store user info in socket data
      socket.data.userId = userId;
      socket.data.userRole = userRole;
      
      // Join user room
      socket.join(`user:${userId}`);
      
      // Join admin room if user is admin
      const isAdmin = !!(userRole && (userRole === 'admin' || (Array.isArray(userRole) && userRole.includes('admin'))));
      if (isAdmin) {
        socket.join('admin');
        socket.data.isAdmin = true;
      }
      
      console.log(`🔐 User authenticated: ${userId} (Admin: ${isAdmin})`);
      socket.emit('auth-success', { userId, isAdmin });
    });

    // Test handler for debugging
    socket.on('test-from-client', (data) => {
      console.log('🧪 [SERVER] Received test from client:', socket.id, data);
      socket.emit('test-response', { message: 'Hello back from server!', socketId: socket.id });
    });

    // Get devices list for user
    socket.on('get-devices', async (data: { userId: string; isAdmin?: boolean; requestId?: string }) => {
      try {
        const { userId, isAdmin = false, requestId } = data;
        
        if (!userId) {
          const errorEvent = requestId ? `devices-error-${requestId}` : 'devices-error';
          socket.emit(errorEvent, { message: 'User ID is required' });
          return;
        }

        console.log(`📋 Getting devices for user: ${userId} (Admin: ${isAdmin})${requestId ? ` - Request ID: ${requestId}` : ''}`);

        let query;
        if (isAdmin) {
          // Admin can see all devices with user information
          query = db
            .select({
              macAddress: devices.macAddress,
              name: devices.name,
              ipAddress: devices.ipAddress,
              isConnected: devices.isConnected,
              lastSeen: devices.lastSeen,
              hardware: devices.hardware,
              userId: devices.userId,
              userName: user.name,
              userEmail: user.email,
              createdAt: devices.createdAt,
              updatedAt: devices.updatedAt
            })
            .from(devices)
            .leftJoin(user, eq(devices.userId, user.id));
        } else {
          // Regular users only see their own devices
          query = db
            .select()
            .from(devices)
            .where(eq(devices.userId, userId));
        }

        const deviceResults = await query;

        const formattedDevices = deviceResults.map(device => ({
          ...device,
          lastSeen: device.lastSeen ? device.lastSeen.toISOString() : null
        }));

        console.log(`✅ Found ${formattedDevices.length} devices${isAdmin ? ' (admin view)' : ` for user ${userId}`}${requestId ? ` - Request ID: ${requestId}` : ''}`);
        
        // Use unique event name if requestId provided, otherwise use default
        const responseEvent = requestId ? `devices-list-${requestId}` : 'devices-list';
        console.log(`📡 Sending response via event: ${responseEvent}`);
        socket.emit(responseEvent, formattedDevices);
              } catch (error) {
          console.error('❌ Error getting devices:', error);
          const errorEvent = data.requestId ? `devices-error-${data.requestId}` : 'devices-error';
          socket.emit(errorEvent, { message: 'Failed to get devices' });
        }
    });

    // Register device when connecting
    socket.on('register-device', async (data: { userId: string, macAddress: string, ipAddress: string }) => {
      try {
        const { userId, macAddress, ipAddress } = data;

        await db
          .update(devices)
          .set({
            ipAddress,
            macAddress,
            lastSeen: new Date(),
            isConnected: true
          })
          .where(and(eq(devices.macAddress, macAddress), eq(devices.userId, userId)));

        setImmediate(() => broadcastDeviceUpdate(macAddress));

        if (!connectedDevices.has(userId)) {
          connectedDevices.set(userId, new Map());
        }
        connectedDevices.get(userId)?.set(macAddress, socket.id);

        socket.join(`user:${userId}`);
        socket.join(`device:${macAddress}`);

        console.log(`✅ Device registered: User ${userId}, Device ${macAddress}`);
        socket.emit('register-success', { macAddress });
      } catch (error) {
        console.error('❌ Error registering device:', error);
        socket.emit('register-error', { message: 'Cannot register device' });
      }
    });

    // Handle shutdown request
    socket.on('shutdown-request', async (data: { userId: string, macAddress: string, isAdmin?: boolean }) => {
      const { userId, macAddress, isAdmin = false } = data;

      try {
        console.log(`🔌 Processing shutdown: ${macAddress} from user: ${userId} (Admin: ${isAdmin})`);

        // Check if device exists and belongs to user (or admin can shutdown any device)
        let deviceQuery;
        if (isAdmin) {
          deviceQuery = db
            .select()
            .from(devices)
            .where(eq(devices.macAddress, macAddress));
        } else {
          deviceQuery = db
            .select()
            .from(devices)
            .where(and(eq(devices.macAddress, macAddress), eq(devices.userId, userId)));
        }

        const device = await deviceQuery.then(results => results[0]);

        if (!device) {
          console.log(`❌ Device ${macAddress} not found${isAdmin ? '' : ` for user ${userId}`}`);
          socket.emit('shutdown-response', { 
            success: false, 
            macAddress,
            message: isAdmin ? 'Device not found' : 'Device not found or does not belong to user' 
          });
          return;
        }

        if (!device.isConnected) {
          console.log(`❌ Device ${macAddress} is not connected`);
          socket.emit('shutdown-response', { 
            success: false, 
            macAddress,
            message: 'Device is not currently connected' 
          });
          return;
        }

        // Try Socket.IO first, then WebSocket
        const userDevices = connectedDevices.get(userId);
        const targetSocketId = userDevices?.get(macAddress);
        let commandSent = false;

        console.log(`🔍 Checking connection methods for device: ${macAddress}`);
        console.log(`📊 Socket.IO connections for user ${userId}:`, userDevices ? Array.from(userDevices.keys()) : 'No connections');

        if (targetSocketId) {
          console.log(`📡 Sending shutdown via Socket.IO to socket: ${targetSocketId}`);
          io.to(targetSocketId).emit('shutdown-command', { macAddress });
          commandSent = true;
        } else {
          console.log(`📡 No Socket.IO connection, trying WebSocket for: ${macAddress}`);
          commandSent = sendWebSocketShutdownCommand(macAddress);
          
          if (!commandSent) {
            console.log(`📡 WebSocket failed, fallback to Socket.IO broadcast to device room: ${macAddress}`);
            io.to(`device:${macAddress}`).emit('shutdown-command', { macAddress });
            commandSent = true;
          } else {
            console.log(`✅ WebSocket shutdown command sent for: ${macAddress}`);
          }
        }

        console.log(`📋 Shutdown command result for ${macAddress}: ${commandSent ? 'SUCCESS' : 'FAILED'}`);

        // Update database
        setImmediate(async () => {
          try {
            await db
              .update(devices)
              .set({ isConnected: false })
              .where(and(eq(devices.macAddress, macAddress), eq(devices.userId, userId)));

            broadcastDeviceShutdown(macAddress);
          } catch (error) {
            console.error('❌ Error updating device status:', error);
          }
        });

        console.log(`✅ Shutdown command sent: ${macAddress}`);
        socket.emit('shutdown-response', { 
          success: true, 
          macAddress,
          message: 'Shutdown command sent successfully' 
        });

      } catch (error) {
        console.error('❌ Error processing shutdown:', error);
        socket.emit('shutdown-response', { 
          success: false, 
          macAddress,
          message: 'Server error processing shutdown request' 
        });
      }
    });

    // Handle client disconnect
    socket.on('disconnect', async () => {
      console.log('❌ Socket.IO client disconnected:', socket.id);

      setImmediate(async () => {
        try {
          for (const [userId, userDevices] of connectedDevices.entries()) {
            for (const [macAddress, socketId] of userDevices.entries()) {
              if (socketId === socket.id) {
                userDevices.delete(macAddress);

                await db
                  .update(devices)
                  .set({ isConnected: false })
                  .where(and(eq(devices.macAddress, macAddress), eq(devices.userId, userId)));

                broadcastDeviceDisconnect(macAddress);
                console.log(`🧹 Device ${macAddress} cleanup complete`);

                if (userDevices.size === 0) {
                  connectedDevices.delete(userId);
                }
                break;
              }
            }
          }
        } catch (error) {
          console.error('❌ Error handling disconnect:', error);
        }
      });
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
