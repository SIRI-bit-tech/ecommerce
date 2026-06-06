import { auth } from "../../../lib/auth.js";
import type { GQLContext } from "../../context.js";
import { GraphQLValidationError } from "../../context.js";

export const authResolvers = {
	Query: {
		me: async (_: unknown, __: unknown, ctx: GQLContext) => {
			return ctx.user;
		},
	},

	Mutation: {
		register: async (
			_: unknown,
			{
				input,
			}: { input: { fullName: string; email: string; password: string } },
			ctx: GQLContext,
		) => {
			if (!input.fullName || input.fullName.trim().length < 2) {
				throw new GraphQLValidationError(
					"Full name must be at least 2 characters",
					"fullName",
				);
			}
			if (!input.email?.includes("@")) {
				throw new GraphQLValidationError("Valid email is required", "email");
			}
			if (!input.password || input.password.length < 8) {
				throw new GraphQLValidationError(
					"Password must be at least 8 characters",
					"password",
				);
			}

			// Check if user already exists
			const existing = await ctx.prisma.user.findUnique({
				where: { email: input.email.toLowerCase() },
			});
			if (existing) {
				throw new GraphQLValidationError(
					"An account with this email already exists",
					"email",
				);
			}

			try {
				const response = await auth.api.signUpEmail({
					body: {
						name: input.fullName,
						fullName: input.fullName, // Required by additionalFields config
						email: input.email.toLowerCase(),
						password: input.password,
					},
				});

				const user = await ctx.prisma.user.findUnique({
					where: { email: input.email.toLowerCase() },
				});

				if (!user) {
					throw new GraphQLValidationError(
						"Registration failed. Please try again.",
					);
				}

				return {
					user,
					token: response.token,
				};
			} catch (error: unknown) {
				if (error instanceof GraphQLValidationError) throw error;
				const message =
					error instanceof Error ? error.message : "Registration failed";
				throw new GraphQLValidationError(message);
			}
		},

		login: async (
			_: unknown,
			{ input }: { input: { email: string; password: string } },
			ctx: GQLContext,
		) => {
			if (!input.email?.includes("@")) {
				throw new GraphQLValidationError("Valid email is required", "email");
			}
			if (!input.password) {
				throw new GraphQLValidationError("Password is required", "password");
			}

			try {
				const response = await auth.api.signInEmail({
					body: {
						email: input.email.toLowerCase(),
						password: input.password,
					},
				});

				const user = await ctx.prisma.user.findUnique({
					where: { email: input.email.toLowerCase() },
				});

				if (!user) {
					throw new GraphQLValidationError("Invalid email or password");
				}

				return {
					user,
					token: response.token,
				};
			} catch (error: unknown) {
				if (error instanceof GraphQLValidationError) throw error;
				throw new GraphQLValidationError("Invalid email or password");
			}
		},

		logout: async (_: unknown, __: unknown, ctx: GQLContext) => {
			try {
				await auth.api.signOut({
					headers: ctx.req.headers as Record<string, string>,
				});
				return true;
			} catch {
				return true; // Always return true — worst case the session already expired
			}
		},

		forgotPassword: async (
			_: unknown,
			{ email }: { email: string },
			_ctx: GQLContext,
		) => {
			if (!email?.includes("@")) {
				throw new GraphQLValidationError("Valid email is required", "email");
			}

			try {
				// @ts-expect-error - forgetPassword might not be typed in this version of better-auth
				await auth.api.forgetPassword({
					body: {
						email: email.toLowerCase(),
						redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
					},
				});
			} catch {
				// Don't reveal if user exists
			}

			// Always return true for security
			return true;
		},

		resetPassword: async (
			_: unknown,
			{ token, newPassword }: { token: string; newPassword: string },
		) => {
			if (!newPassword || newPassword.length < 8) {
				throw new GraphQLValidationError(
					"Password must be at least 8 characters",
					"newPassword",
				);
			}

			try {
				await auth.api.resetPassword({
					body: {
						token,
						newPassword,
					},
				});
				return true;
			} catch {
				throw new GraphQLValidationError("Invalid or expired reset token");
			}
		},
	},
};
