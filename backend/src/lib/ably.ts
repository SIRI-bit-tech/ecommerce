import Ably from "ably";
import { env } from "../config/env.js";

const globalForAbly = globalThis as unknown as {
	ably: Ably.Rest | undefined;
};

export const ably =
	globalForAbly.ably ??
	(env.ABLY_API_KEY && env.ABLY_API_KEY.includes(":")
		? new Ably.Rest({ key: env.ABLY_API_KEY })
		: undefined);

if (env.isDev && ably) {
	globalForAbly.ably = ably;
}

export async function publishToChannel(
	channelName: string,
	eventName: string,
	data: unknown,
): Promise<void> {
	if (!ably) {
		console.warn(`[Ably] Mock publish to ${channelName} -> ${eventName}:`, data);
		return;
	}
	const channel = ably.channels.get(channelName);
	await channel.publish(eventName, data);
}
