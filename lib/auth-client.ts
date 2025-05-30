import { inferAdditionalFields, apiKeyClient, adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/vue";
import type { auth } from "./auth"
export const authClient = createAuthClient({
	plugins: [inferAdditionalFields<typeof auth>(), apiKeyClient(), adminClient()],
	baseURL: process.env.BETTER_AUTH_URL,
});

export const {
	signIn,
	signOut,
	signUp,
	useSession,
	getSession,
	forgetPassword,
	resetPassword,
	deleteUser,
	updateUser,
} = authClient;