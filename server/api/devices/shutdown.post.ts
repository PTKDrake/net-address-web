import { auth } from '~~/lib/auth';
import { useDrizzle } from '~~/server/utils/drizzle';
import { devices } from '~~/db/deviceSchema';
import { eq, and } from 'drizzle-orm';
import { sendShutdownCommand as sendWebSocketShutdownCommand } from '~~/server/api/websocket';
import { broadcastDeviceShutdown } from '~~/server/plugins/socket.io';

export default defineEventHandler(async (event) => {
  try {
    // Get user session
    const session = await auth.api.getSession({
      headers: new Headers(event.node.req.headers as Record<string, string>)
    });
    
    if (!session?.user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'User not authenticated'
      });
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    const isAdmin = userRole === 'admin' || (Array.isArray(userRole) && userRole.includes('admin'));

    // Get request body
    const body = await readBody(event);
    const { macAddress } = body;

    if (!macAddress) {
      throw createError({
        statusCode: 400,
        statusMessage: 'MAC address is required'
      });
    }

    console.log(`🔌 [HTTP] Processing shutdown: ${macAddress} from user: ${userId} (Admin: ${isAdmin})`);

    const db = useDrizzle();

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
      console.log(`❌ [HTTP] Device ${macAddress} not found${isAdmin ? '' : ` for user ${userId}`}`);
      throw createError({
        statusCode: 404,
        statusMessage: isAdmin ? 'Device not found' : 'Device not found or does not belong to user'
      });
    }

    if (!device.isConnected) {
      console.log(`❌ [HTTP] Device ${macAddress} is not connected`);
      throw createError({
        statusCode: 400,
        statusMessage: 'Device is not currently connected'
      });
    }

    // Try to send shutdown command via WebSocket
    console.log(`📡 [HTTP] Sending shutdown via WebSocket for: ${macAddress}`);
    const commandSent = sendWebSocketShutdownCommand(macAddress);

    if (!commandSent) {
      console.log(`❌ [HTTP] WebSocket shutdown failed for: ${macAddress}`);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to send shutdown command to device'
      });
    }

    // Update database
    await db
      .update(devices)
      .set({ 
        isConnected: false,
        lastSeen: new Date()
      })
      .where(eq(devices.macAddress, macAddress));

    // Broadcast to Socket.IO clients
    setImmediate(() => {
      broadcastDeviceShutdown(macAddress);
    });

    console.log(`✅ [HTTP] Shutdown command sent successfully: ${macAddress}`);

    return {
      success: true,
      message: 'Shutdown command sent successfully',
      macAddress,
      deviceName: device.name
    };
  } catch (error: any) {
    console.error('❌ [HTTP] Error processing shutdown:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    });
  }
}); 