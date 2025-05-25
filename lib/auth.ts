import { betterAuth } from "better-auth";
import { apiKey, openAPI, bearer, admin } from "better-auth/plugins"
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { useDrizzle } from "../server/utils/drizzle";
import { sendUserVerificationEmail, sendUserResetPasswordEmail } from "../server/utils/email";

export const auth = betterAuth({
    database: drizzleAdapter(useDrizzle(), {
        provider: 'pg'
    }),
    plugins: [apiKey(), openAPI(), bearer(), admin()],
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            mapProfileToUser: (profile) => {
                return {
                    firstName: profile.given_name,
                    lastName: profile.family_name,
                };
            },
            verifyIdToken: async (token, nonce) => {
                return true;
            }
        }
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        async sendResetPassword({ user, url }) {
            await sendUserResetPasswordEmail(user, url);
        }
    },
    emailVerification: {
        async sendVerificationEmail({ user, url }) {
            await sendUserVerificationEmail(user, url);
        },
        sendOnSignUp: true
    },
    user: {
        additionalFields: {
            firstName: {
                type: "string",
                fieldName: "firstName",
                returned: true,
                input: true,
                required: true,
            },
            lastName: {
                type: "string",
                fieldName: "lastName",
                returned: true,
                input: true,
                required: true,
            }
        },
        deleteUser: {
            enabled: true,
        }
    }
});