import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { env } from "../config/env.js";
import { prisma } from "./prisma.js";
import { sendPasswordResetEmail, sendWelcomeEmail, sendOTPEmail } from "./resend.js";

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	trustedOrigins: [env.FRONTEND_URL],
	plugins: [
		emailOTP({
			async sendVerificationOTP({ email, otp, type }) {
				if (type === "sign-in" || type === "email-verification") {
					await sendOTPEmail(email, otp);
				}
			},
		}),
	],
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		sendResetPassword: async ({ user, url }) => {
			await sendPasswordResetEmail(user.email, user.name, url);
		},
	},
	user: {
		additionalFields: {
			fullName: {
				type: "string",
				required: true,
				input: true,
			},
			phoneNumber: {
				type: "string",
				required: false,
				input: true,
			},
			address: {
				type: "string",
				required: false,
				input: true,
			},
			city: {
				type: "string",
				required: false,
				input: true,
			},
			state: {
				type: "string",
				required: false,
				input: true,
			},
			role: {
				type: "string",
				required: false,
				defaultValue: "CUSTOMER",
				input: false,
			},
		},
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60, // 5 minutes
		},
	},
	hooks: {
		after: async (ctx: any) => {
			if (ctx?.path === "/sign-up/email" && ctx?.context?.newUser) {
				const newUser = ctx.context.newUser;
				if (newUser.email && newUser.name) {
					try {
						await sendWelcomeEmail(newUser.email, newUser.name);
					} catch (err) {
						console.error("Failed to send welcome email:", err);
					}
				}
			}
			return ctx;
		},
	},
});

export type AuthSession = typeof auth.$Infer.Session;
