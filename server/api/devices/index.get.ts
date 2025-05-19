import {useDrizzle} from '~~/server/utils/drizzle';
import {devices} from '~~/db/deviceSchema';
import {eq} from 'drizzle-orm';
import {auth} from '~~/lib/auth';

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

  // Initialize Drizzle
  const db = useDrizzle();

  try {
    // Fetch devices for the current user
    return await db.select().from(devices).where(eq(devices.userId, userId));
  } catch (error) {
    console.error('Error fetching devices:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch devices'
    });
  }
});