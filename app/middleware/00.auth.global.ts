import { authClient } from "~~/lib/auth-client";

export default defineNuxtRouteMiddleware(async (to) => {
    // Danh sách các route công khai, không cần xác thực
    const publicRoutes = [
        '/login',
        '/signup',
        '/register',
        '/auth/callback',
        '/signout',
        '/email-verification',
        '/forgot-password',
        '/reset-password',
    ];

    // Kiểm tra xem đường dẫn hiện tại có nằm trong danh sách công khai
    const isPublicRoute = publicRoutes.some(route =>
        to.path === route || to.path.startsWith('/auth/')
    );

    // Lấy thông tin phiên
    const { data: session } = await authClient.useSession(useFetch);
    let user = session.value?.user;
    if(isPublicRoute) {
        const { data: session } = await authClient.getSession();
        user = session?.user;
    }

    // Xác định xem người dùng đã đăng nhập chưa
    const isAuthenticated = !!user;

    // Xử lý các route xác thực (login/signup)
    if (to.path === '/login' || to.path === '/signup') {
        // Nếu đã đăng nhập, chuyển hướng về trang chủ
        if (isAuthenticated) {
            return navigateTo('/');
        }
        // Nếu chưa đăng nhập, cho phép truy cập
        return;
    }

    // Nếu cố gắng truy cập route bảo vệ, nhưng chưa đăng nhập
    if (!isPublicRoute && !isAuthenticated) {
        return navigateTo('/login');
    }
});