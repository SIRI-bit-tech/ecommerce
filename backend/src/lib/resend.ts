import { Resend } from "resend";
import { env } from "../config/env.js";

export const resend = new Resend(env.RESEND_API_KEY);

const FROM_EMAIL = "Rey's Vogue <noreply@reyvouge.com>";

// ─── Utility: format kobo to Naira ──────────────────────────────────────────

function formatNaira(kobo: number): string {
	return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

// ─── Email Templates ────────────────────────────────────────────────────────

function baseLayout(content: string): string {
	return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rey's Vogue</title>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border:1px solid #3c3c3c;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #3c3c3c;">
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:3px;text-transform:uppercase;">
                REY'S VOGUE
              </h1>
              <!-- Gold accent stripe -->
              <div style="margin-top:12px;height:3px;width:80px;background:linear-gradient(90deg,#c9a96e,#e8d5a3,#c9a96e);"></div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #3c3c3c;text-align:center;">
              <p style="margin:0;font-size:12px;color:#7e7e7e;line-height:1.5;">
                &copy; ${new Date().getFullYear()} Rey's Vogue. All rights reserved.<br>
                Premium Fashion &amp; Lifestyle
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Welcome Email ──────────────────────────────────────────────────────────

export async function sendWelcomeEmail(
	to: string,
	fullName: string,
): Promise<void> {
	const content = `
    <h2 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">
      Welcome, ${fullName}
    </h2>
    <p style="margin:0 0 24px;font-size:16px;color:#bbbbbb;line-height:1.6;">
      Thank you for joining Rey's Vogue. You now have access to our curated collection of premium fashion, footwear, and fragrances.
    </p>
    <a href="${env.FRONTEND_URL}/shop" style="display:inline-block;padding:14px 32px;background-color:#c9a96e;color:#000000;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
      EXPLORE COLLECTION
    </a>
  `;

	await resend.emails.send({
		from: FROM_EMAIL,
		to,
		subject: "Welcome to Rey's Vogue",
		html: baseLayout(content),
	});
}

// ─── Password Reset Email ───────────────────────────────────────────────────

export async function sendPasswordResetEmail(
	to: string,
	fullName: string,
	resetUrl: string,
): Promise<void> {
	const content = `
    <h2 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">
      Reset Your Password
    </h2>
    <p style="margin:0 0 8px;font-size:16px;color:#bbbbbb;line-height:1.6;">
      Hi ${fullName},
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:#bbbbbb;line-height:1.6;">
      We received a request to reset your password. Click the button below to create a new password. This link expires in 1 hour.
    </p>
    <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background-color:#c9a96e;color:#000000;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
      RESET PASSWORD
    </a>
    <p style="margin:24px 0 0;font-size:14px;color:#7e7e7e;line-height:1.5;">
      If you didn't request this, you can safely ignore this email.
    </p>
  `;

	await resend.emails.send({
		from: FROM_EMAIL,
		to,
		subject: "Reset Your Password — Rey's Vogue",
		html: baseLayout(content),
	});
}

// ─── Order Confirmation Email ───────────────────────────────────────────────

interface OrderEmailData {
	orderId: string;
	fullName: string;
	items: Array<{
		name: string;
		quantity: number;
		unitPrice: number;
		size?: string;
		color?: string;
	}>;
	subtotal: number;
	shippingFee: number;
	total: number;
	paymentMethod: string;
	shippingAddress: {
		fullName: string;
		address: string;
		city: string;
		state: string;
	};
}

export async function sendOrderConfirmationEmail(
	to: string,
	data: OrderEmailData,
): Promise<void> {
	const itemRows = data.items
		.map(
			(item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #262626;color:#bbbbbb;font-size:14px;">
          ${item.name}${item.size ? ` — ${item.size}` : ""}${item.color ? ` — ${item.color}` : ""}
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #262626;color:#bbbbbb;font-size:14px;text-align:center;">
          ${item.quantity}
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #262626;color:#ffffff;font-size:14px;text-align:right;">
          ${formatNaira(item.unitPrice * item.quantity)}
        </td>
      </tr>`,
		)
		.join("");

	const content = `
    <h2 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">
      Order Confirmed
    </h2>
    <p style="margin:0 0 24px;font-size:16px;color:#bbbbbb;line-height:1.6;">
      Hi ${data.fullName}, your order <strong style="color:#c9a96e;">#${data.orderId.slice(-8).toUpperCase()}</strong> has been confirmed.
    </p>

    <!-- Items Table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #3c3c3c;color:#7e7e7e;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Item</td>
        <td style="padding:8px 0;border-bottom:1px solid #3c3c3c;color:#7e7e7e;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;text-align:center;">Qty</td>
        <td style="padding:8px 0;border-bottom:1px solid #3c3c3c;color:#7e7e7e;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;text-align:right;">Price</td>
      </tr>
      ${itemRows}
    </table>

    <!-- Totals -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:4px 0;color:#bbbbbb;font-size:14px;">Subtotal</td>
        <td style="padding:4px 0;color:#ffffff;font-size:14px;text-align:right;">${formatNaira(data.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#bbbbbb;font-size:14px;">Shipping</td>
        <td style="padding:4px 0;color:#ffffff;font-size:14px;text-align:right;">${formatNaira(data.shippingFee)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-top:1px solid #3c3c3c;color:#ffffff;font-size:18px;font-weight:700;">Total</td>
        <td style="padding:8px 0;border-top:1px solid #3c3c3c;color:#c9a96e;font-size:18px;font-weight:700;text-align:right;">${formatNaira(data.total)}</td>
      </tr>
    </table>

    <!-- Shipping Address -->
    <div style="padding:16px;background-color:#0d0d0d;border:1px solid #262626;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:12px;color:#7e7e7e;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Shipping To</p>
      <p style="margin:0;font-size:14px;color:#bbbbbb;line-height:1.5;">
        ${data.shippingAddress.fullName}<br>
        ${data.shippingAddress.address}<br>
        ${data.shippingAddress.city}, ${data.shippingAddress.state}
      </p>
    </div>

    <a href="${env.FRONTEND_URL}/account/orders/${data.orderId}" style="display:inline-block;padding:14px 32px;background-color:#c9a96e;color:#000000;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
      VIEW ORDER
    </a>
  `;

	await resend.emails.send({
		from: FROM_EMAIL,
		to,
		subject: `Order Confirmed — #${data.orderId.slice(-8).toUpperCase()}`,
		html: baseLayout(content),
	});
}

// ─── Order Status Update Email ──────────────────────────────────────────────

export async function sendOrderStatusEmail(
	to: string,
	fullName: string,
	orderId: string,
	status: string,
	trackingInfo?: string,
	cancellationReason?: string,
): Promise<void> {
	const statusLabels: Record<
		string,
		{ title: string; message: string; color: string }
	> = {
		CONFIRMED: {
			title: "Order Confirmed",
			message: "Your order has been confirmed and is being prepared.",
			color: "#c9a96e",
		},
		PROCESSING: {
			title: "Order Processing",
			message:
				"Your order is currently being processed and will be shipped soon.",
			color: "#1c69d4",
		},
		SHIPPED: {
			title: "Order Shipped",
			message: "Your order has been shipped and is on its way to you.",
			color: "#0fa336",
		},
		DELIVERED: {
			title: "Order Delivered",
			message:
				"Your order has been delivered. We hope you enjoy your purchase!",
			color: "#0fa336",
		},
		CANCELLED: {
			title: "Order Cancelled",
			message: "Your order has been cancelled.",
			color: "#e22718",
		},
	};

	const info = statusLabels[status] ?? {
		title: `Order ${status}`,
		message: `Your order status has been updated to ${status}.`,
		color: "#c9a96e",
	};

	let extraContent = "";
	if (status === "SHIPPED" && trackingInfo) {
		extraContent = `
      <div style="padding:16px;background-color:#0d0d0d;border:1px solid #262626;margin:16px 0;">
        <p style="margin:0 0 4px;font-size:12px;color:#7e7e7e;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Tracking Info</p>
        <p style="margin:0;font-size:14px;color:#c9a96e;">${trackingInfo}</p>
      </div>
    `;
	}
	if (status === "CANCELLED" && cancellationReason) {
		extraContent = `
      <div style="padding:16px;background-color:#0d0d0d;border:1px solid #262626;margin:16px 0;">
        <p style="margin:0 0 4px;font-size:12px;color:#7e7e7e;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Reason</p>
        <p style="margin:0;font-size:14px;color:#bbbbbb;">${cancellationReason}</p>
      </div>
    `;
	}

	const content = `
    <div style="margin-bottom:24px;padding:16px;border-left:4px solid ${info.color};">
      <h2 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">
        ${info.title}
      </h2>
      <p style="margin:0;font-size:14px;color:#7e7e7e;">Order #${orderId.slice(-8).toUpperCase()}</p>
    </div>
    <p style="margin:0 0 16px;font-size:16px;color:#bbbbbb;line-height:1.6;">
      Hi ${fullName}, ${info.message}
    </p>
    ${extraContent}
    <a href="${env.FRONTEND_URL}/account/orders/${orderId}" style="display:inline-block;padding:14px 32px;background-color:#c9a96e;color:#000000;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-top:16px;">
      VIEW ORDER
    </a>
  `;

	await resend.emails.send({
		from: FROM_EMAIL,
		to,
		subject: `${info.title} — #${orderId.slice(-8).toUpperCase()}`,
		html: baseLayout(content),
	});
}
