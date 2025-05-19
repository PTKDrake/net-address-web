import { useDrizzle } from '~~/server/utils/drizzle';
import { devices } from '~~/db/deviceSchema';
import { eq, and } from 'drizzle-orm';
import {auth} from '~~/lib/auth';
import { sendShutdownCommand } from '../websocket';

export default defineEventHandler(async (event) => {
  // Get the current user session
  const session = await auth.api.getSession({ headers: event.headers });

  if (!session || !session.user || !session.user.id) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    });
  }

  // Get user ID from session
  const userId = session.user.id;

  // Get request body
  const body = await readBody(event);

  if (!body || !body.macAddress) {
    throw createError({
      statusCode: 400,
      message: 'Device ID is required'
    });
  }

  const macAddress = body.macAddress;

  // Initialize Drizzle
  const db = useDrizzle();

  try {
    // First check if the device belongs to the user
    const userDevice = await db
      .select()
      .from(devices)
      .where(and(eq(devices.macAddress, macAddress), eq(devices.userId, userId)))
      .then(results => results[0]);

    if (!userDevice) {
      throw createError({
        statusCode: 404,
        message: 'Device not found or does not belong to user'
      });
    }

    // Send shutdown command via websocket
    console.log(`Attempting to send shutdown command to device: ${macAddress}`);
    const commandSent = sendShutdownCommand(macAddress);

    if (!commandSent) {
      console.warn(`Failed to send shutdown command to device: ${macAddress} - Device not connected`);
      throw createError({
        statusCode: 400,
        message: 'Device is not currently connected'
      });
    }

    console.log(`Shutdown command sent successfully to device: ${macAddress}`);

    // Update device status to not connected
    await db
      .update(devices)
      .set({ isConnected: false })
      .where(eq(devices.macAddress, macAddress));

    return { success: true };
  } catch (error) {
    console.error('Error shutting down device:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to shutdown device'
    });
  }
});
