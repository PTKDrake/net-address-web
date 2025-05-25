import { useDrizzle } from '~~/server/utils/drizzle';
import { devices } from '~~/db/deviceSchema';
import { user } from '~~/db/authSchema';
import { eq } from 'drizzle-orm';
import { auth } from '~~/lib/auth';

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
    
    // Check if user is admin
    const isAdmin = userRole === 'admin' || (Array.isArray(userRole) && userRole.includes('admin'));
    
    console.log(`📋 [HTTP] Getting devices for user: ${userId} (Admin: ${isAdmin})`);

    const db = useDrizzle();
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

    // Debug: Log raw results for admin queries
    if (isAdmin && deviceResults.length > 0) {
      const sampleDevice = deviceResults[0] as any;
      console.log('🔍 [HTTP] Raw device result sample:', {
        device: sampleDevice,
        fields: Object.keys(sampleDevice),
        hasUserName: !!sampleDevice.userName,
        hasUserEmail: !!sampleDevice.userEmail,
        hasUserId: !!sampleDevice.userId
      });
    }

    const formattedDevices = deviceResults.map(device => ({
      ...device,
      lastSeen: device.lastSeen ? device.lastSeen.toISOString() : null
    }));

    // Debug: Log formatted results for admin queries  
    if (isAdmin && formattedDevices.length > 0) {
      const sampleFormatted = formattedDevices[0] as any;
      console.log('🔍 [HTTP] Formatted device sample:', {
        device: sampleFormatted,
        userName: sampleFormatted.userName,
        userEmail: sampleFormatted.userEmail,
        userId: sampleFormatted.userId
      });
    }

    console.log(`✅ [HTTP] Found ${formattedDevices.length} devices${isAdmin ? ' (admin view)' : ` for user ${userId}`}`);
    
    return {
      success: true,
      devices: formattedDevices,
      count: formattedDevices.length,
      isAdmin
    };
  } catch (error: any) {
    console.error('❌ [HTTP] Error getting devices:', error);
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to get devices'
    });
  }
}); 