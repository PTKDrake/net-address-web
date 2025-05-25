import { getSession } from '~~/lib/auth-client';

// List of public routes that don't require authentication
const publicRoutes = [
    '/login',
    '/signup', 
    '/email-verification',
    '/forgot-password',
    '/reset-password',
    '/oauth/redirect',
    '/about'
];

// Routes that authenticated users should not access
const authRoutes = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password'
];

export default defineNuxtRouteMiddleware(async (to) => {
    // Check if the current path is in the public routes list
    const isPublicRoute = publicRoutes.some(route => {
        if (route === '/') {
            return to.path === '/';
        }
        return to.path.startsWith(route);
    });

    // Check if user is logged in
    const session = await getSession();
    const isLoggedIn = !!session.data?.user;

    // If user is logged in
    if (isLoggedIn) {
        // Redirect authenticated users away from auth pages
        const isAuthRoute = authRoutes.some(route => to.path.startsWith(route));
        if (isAuthRoute) {
            return navigateTo('/devices');
        }
    } else {
        // If not logged in and trying to access protected route, redirect to login
        if (!isPublicRoute) {
            return navigateTo('/login');
        }
    }
});