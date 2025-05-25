import { getSession } from '~~/lib/auth-client';

// List of public routes that don't require authentication
const publicRoutes = [
    '/auth/signin',
    '/auth/signup',
    '/auth/verify-email',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/',
];

export default defineNuxtRouteMiddleware(async (to) => {
    // Check if the current path is in the public list
    const isPublicRoute = publicRoutes.some(route => {
        if (route === '/') {
            return to.path === '/';
        }
        return to.path.startsWith(route);
    });

    // If it's a public route, allow access
    if (isPublicRoute) {
        return;
    }

    // Check if user is logged in
    const session = await getSession();
    const isLoggedIn = !!session.data?.user;

    if (isLoggedIn) {
        // If logged in, redirect to home page
        if (to.path === '/auth/signin' || to.path === '/auth/signup') {
            return navigateTo('/dashboard');
        }
    } else {
        // If not logged in and trying to access protected route, redirect to login
        if (!isPublicRoute) {
            return navigateTo('/auth/signin');
        }
    }
});