import { broadcastDeviceUpdate, broadcastDeviceDisconnect, broadcastDeviceShutdown } from '~~/server/plugins/socket.io';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { type, macAddress, deviceName } = body;

    switch (type) {
      case 'device-update':
        console.log(`🧪 [DEBUG] Manually triggering device-update for: ${macAddress}`);
        await broadcastDeviceUpdate(macAddress);
        break;
        
      case 'device-disconnect':
        console.log(`🧪 [DEBUG] Manually triggering device-disconnect for: ${macAddress}`);
        await broadcastDeviceDisconnect(macAddress);
        break;
        
      case 'device-shutdown':
        console.log(`🧪 [DEBUG] Manually triggering device-shutdown for: ${macAddress}`);
        await broadcastDeviceShutdown(macAddress);
        break;
        
      default:
        throw new Error(`Unknown event type: ${type}`);
    }

    return {
      success: true,
      message: `Event ${type} triggered for ${macAddress}`,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.error('❌ Error triggering debug event:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to trigger event'
    });
  }
}); 