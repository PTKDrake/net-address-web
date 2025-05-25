import { getSession } from '~~/lib/auth-client';

export default defineNuxtRouteMiddleware(async (to) => {
  // Check if user is logged in and has admin role
  const session = await getSession();
  const user = session.data?.user;
  
  if (!user) {
    // Not logged in, redirect to login
    return navigateTo('/login');
  }

  // Check if user has admin role
  const userRole = user.role;
  const isAdmin = userRole === 'admin' || (Array.isArray(userRole) && userRole.includes('admin'));
  
  if (!isAdmin) {
    // Not admin, redirect to regular devices page
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. Admin privileges required.'
    });
  }
}); 