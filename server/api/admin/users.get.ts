import { auth } from '~~/lib/auth';
import { useDrizzle } from '~~/server/utils/drizzle';
import { user } from '~~/db/authSchema';

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

    // Get all users from database
    const allUsers = await useDrizzle()
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        banned: user.banned,
        banReason: user.banReason,
        banExpires: user.banExpires,
        createdAt: user.createdAt,
        emailVerified: user.emailVerified
      })
      .from(user)
      .orderBy(user.createdAt);

    return {
      users: allUsers,
      total: allUsers.length
    };
  } catch (error: any) {
    console.error('❌ Error in admin users API:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    });
  }
}); 