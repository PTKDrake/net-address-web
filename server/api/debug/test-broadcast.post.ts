import { broadcastDeviceDisconnect, broadcastDeviceShutdown, getSocketIOInstance } from '../../plugins/socket.io';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { type, macAddress } = body;

  if (!macAddress) {
    throw createError({
      statusCode: 400,
      statusMessage: 'macAddress is required'
    });
  }

  try {
    console.log(`🧪 Testing broadcast: ${type} for ${macAddress}`);
    
    const io = getSocketIOInstance();
    if (!io) {
      throw new Error('Socket.IO instance not available');
    }

    console.log(`📊 Connected Socket.IO clients: ${io.engine.clientsCount}`);

    switch (type) {
      case 'disconnect':
        await broadcastDeviceDisconnect(macAddress);
        break;
      case 'shutdown':
        await broadcastDeviceShutdown(macAddress);
        break;
      case 'direct':
        // Direct emit test
        console.log(`📡 Direct emit test for: ${macAddress}`);
        io.emit('device-disconnect', macAddress);
        break;
      default:
        throw new Error(`Unknown broadcast type: ${type}`);
    }

    return {
      success: true,
      message: `${type} broadcast sent for ${macAddress}`,
      connectedClients: io.engine.clientsCount
    };
  } catch (error: any) {
    console.error('❌ Test broadcast error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Broadcast test failed'
    });
  }
}); 