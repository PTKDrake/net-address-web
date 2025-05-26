import { auth } from '~~/lib/auth';
import { useDrizzle } from '~~/server/utils/drizzle';
import { user } from '~~/db/authSchema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  try {
    // Get session from better-auth
    const session = await auth.api.getSession({
      headers: new Headers(event.node.req.headers as Record<string, string>)
    });

    if (!session?.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      });
    }

    // Check if user has admin role
    const userRole = session.user.role;
    const isAdmin = userRole === 'admin' || (Array.isArray(userRole) && userRole.includes('admin'));

    if (!isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied. Admin privileges required.'
      });
    }

    // Get request body
    const body = await readBody(event);
    const { userId, role } = body;

    if (!userId || !role) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID and role are required'
      });
    }

    // Validate role
    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(role)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid role. Must be "user" or "admin"'
      });
    }

    console.log(`🔧 Setting user ${userId} role to: ${role}`);

    // Update user role in database
    const db = useDrizzle();
    const result = await db
      .update(user)
      .set({ 
        role: role,
        updatedAt: new Date()
      })
      .where(eq(user.id, userId))
      .returning();

    if (result.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      });
    }

    console.log(`✅ Successfully updated user ${userId} role to: ${role}`);

    return {
      success: true,
      message: `User role updated to ${role}`,
      userId,
      newRole: role
    };
  } catch (error: any) {
    console.error('❌ Error setting user role:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    });
  }
}); 