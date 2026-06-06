import crypto from "node:crypto";
import { env } from "../config/env.js";

const FLUTTERWAVE_BASE = "https://api.flutterwave.com/v3";



function getHeaders(): Record<string, string> {
	return {
		Authorization: `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`,
		"Content-Type": "application/json",
	};
}

// ─── Initialize Transaction (Card Payment) ─────────────────────────────────

interface InitializePaymentParams {
	email: string;
	amount: number; // kobo (will be converted to Naira for Flutterwave)
	reference: string;
	callbackUrl: string;
	metadata?: Record<string, unknown>;
}

interface FlutterwaveInitResponse {
	status: string;
	message: string;
	data: {
		link: string;
	};
}

export async function initializePayment(
	params: InitializePaymentParams,
): Promise<FlutterwaveInitResponse> {
	const response = await fetch(`${FLUTTERWAVE_BASE}/payments`, {
		method: "POST",
		headers: getHeaders(),
		body: JSON.stringify({
			tx_ref: params.reference,
			amount: params.amount / 100, // Convert kobo to Naira
			currency: "NGN",
			redirect_url: params.callbackUrl,
			customer: {
				email: params.email,
			},
			payment_options: "card",
			meta: params.metadata,
			customizations: {
				title: "Reyvouge",
			},
		}),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Flutterwave initialize failed: ${error}`);
	}

	return response.json() as Promise<FlutterwaveInitResponse>;
}

// ─── Initialize Bank Transfer ───────────────────────────────────────────────

interface CreateBankTransferParams {
	email: string;
	amount: number; // kobo (will be converted to Naira for Flutterwave)
	reference: string;
	firstName: string;
	lastName: string;
	callbackUrl: string;
	metadata?: Record<string, unknown>;
}

interface FlutterwaveBankTransferResponse {
	status: string;
	message: string;
	data: {
		link: string;
	};
}

export async function initializeBankTransfer(
	params: CreateBankTransferParams,
): Promise<FlutterwaveBankTransferResponse> {
	const response = await fetch(`${FLUTTERWAVE_BASE}/payments`, {
		method: "POST",
		headers: getHeaders(),
		body: JSON.stringify({
			tx_ref: params.reference,
			amount: params.amount / 100, // Convert kobo to Naira
			currency: "NGN",
			redirect_url: params.callbackUrl,
			customer: {
				email: params.email,
				name: `${params.firstName} ${params.lastName}`,
			},
			payment_options: "banktransfer",
			meta: params.metadata,
			customizations: {
				title: "Reyvouge",
			},
		}),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Flutterwave bank transfer init failed: ${error}`);
	}

	return response.json() as Promise<FlutterwaveBankTransferResponse>;
}

// ─── Verify Transaction ─────────────────────────────────────────────────────

interface FlutterwaveVerifyResponse {
	status: string;
	message: string;
	data: {
		id: number;
		tx_ref: string;
		flw_ref: string;
		amount: number; // Naira
		currency: string;
		charged_amount: number;
		status: string; // "successful", "failed", "pending"
		payment_type: string;
		created_at: string;
		customer: {
			email: string;
			name: string;
		};
		meta: Record<string, unknown>;
	};
}

export async function verifyTransaction(
	transactionId: string,
): Promise<FlutterwaveVerifyResponse> {
	const response = await fetch(
		`${FLUTTERWAVE_BASE}/transactions/${encodeURIComponent(transactionId)}/verify`,
		{
			method: "GET",
			headers: getHeaders(),
		},
	);

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Flutterwave verify failed: ${error}`);
	}

	return response.json() as Promise<FlutterwaveVerifyResponse>;
}

// ─── Webhook Signature Verification ─────────────────────────────────────────

export function verifyWebhookSignature(secretHash: string): boolean {
	return secretHash === env.FLUTTERWAVE_SECRET_HASH;
}

// ─── Generate Reference ─────────────────────────────────────────────────────

export function generateFlutterwaveReference(): string {
	const timestamp = Date.now().toString(36);
	const randomPart = crypto.randomBytes(6).toString("hex");
	return `rv_${timestamp}_${randomPart}`;
}
