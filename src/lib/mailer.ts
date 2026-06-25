import nodemailer from "nodemailer";

type ContactMessage = {
  name: string;
  email: string;
  phone?: string;
  message: string;
};

type ReceiptItem = {
  title: string;
  quantity: number;
  totalKobo: number;
};

type ReceiptMessage = {
  to: string;
  reference: string;
  subtotalKobo: number;
  transactionFeeKobo: number;
  totalKobo: number;
  items: ReceiptItem[];
};

type TicketMessage = ReceiptMessage & {
  tickets: Array<{
    eventTitle: string;
    venue?: string;
    startsAt?: Date | string;
    attendeeName?: string | null;
    qrCode: string;
    qrImageUrl?: string | null;
    qrImageHttpUrl?: string;
    ticketUrl: string;
  }>;
};

type SubscriberBroadcastMessage = {
  to: string;
  subject: string;
  message: string;
};

async function sendEmail(payload: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    return transporter.sendMail({
      from: process.env.MAIL_FROM ?? process.env.SMTP_USER,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
  }

  if (!process.env.RESEND_API_KEY) {
    return {
      skipped: true,
      reason: "No mail provider is configured. Add SMTP credentials or RESEND_API_KEY.",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Unable to send email.");
  }

  return data;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNairaForEmail(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

function formatDateForEmail(date?: Date | string) {
  if (!date) return "";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function emailShell(content: string) {
  return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Popsy Adonis</title>
  </head>
  <body style="margin:0;background:#050505;color:#fffdf8;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#101010;border:1px solid rgba(255,255,255,.12);border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 18px;border-bottom:1px solid rgba(255,255,255,.12);">
                <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#c8a24a;font-weight:800;">Popsy Adonis</div>
                <div style="font-size:32px;line-height:1.05;font-weight:900;margin-top:8px;color:#fffdf8;">Culture, access, and PA FLUX.</div>
              </td>
            </tr>
            ${content}
            <tr>
              <td style="padding:22px 28px;background:#080808;border-top:1px solid rgba(255,255,255,.10);font-size:12px;line-height:18px;color:rgba(255,253,248,.55);">
                Popsy Adonis · Victoria Island, Lagos, Nigeria<br />
                Keep this email for your records. For support, reply to this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function ctaButton(label: string, href: string) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:#c8a24a;color:#050505;text-decoration:none;font-size:14px;font-weight:900;padding:14px 18px;border-radius:8px;">${escapeHtml(label)}</a>`;
}

function paragraphsToHtml(message: string) {
  return message
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p style="margin:0 0 16px;font-size:14px;line-height:23px;color:rgba(255,253,248,.72);">${escapeHtml(paragraph).replaceAll("\n", "<br />")}</p>`)
    .join("");
}

export async function sendContactMessage(message: ContactMessage) {
  return sendEmail({
    to: process.env.MAIL_TO ?? "adonistv.001@gmail.com",
    subject: `New Popsy Adonis inquiry from ${message.name}`,
    text: [
      `Name: ${message.name}`,
      `Email: ${message.email}`,
      `Phone: ${message.phone ?? "Not provided"}`,
      "",
      message.message,
    ].join("\n"),
  });
}

export async function sendPurchaseReceipt(message: ReceiptMessage) {
  const itemsHtml = message.items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:14px;color:#fffdf8;">
            ${escapeHtml(item.title)}
            <span style="color:rgba(255,253,248,.52);">×${item.quantity}</span>
          </td>
          <td align="right" style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:14px;font-weight:800;color:#fffdf8;">
            ${formatNairaForEmail(item.totalKobo)}
          </td>
        </tr>`,
    )
    .join("");

  return sendEmail({
    to: message.to,
    subject: `Popsy Adonis receipt - ${message.reference}`,
    text: [
      "Thank you for your Popsy Adonis purchase.",
      "",
      `Reference: ${message.reference}`,
      "",
      "Items:",
      ...message.items.map((item) => `- ${item.title} x${item.quantity}: ${formatNairaForEmail(item.totalKobo)}`),
      "",
      `Subtotal: ${formatNairaForEmail(message.subtotalKobo)}`,
      `Transaction Fee: ${formatNairaForEmail(message.transactionFeeKobo)}`,
      `Total Payable: ${formatNairaForEmail(message.totalKobo)}`,
    ].join("\n"),
    html: emailShell(`
      <tr>
        <td style="padding:28px;">
          <div style="font-size:13px;font-weight:800;color:#c8a24a;text-transform:uppercase;letter-spacing:.08em;">Payment confirmed</div>
          <h1 style="margin:8px 0 8px;font-size:28px;line-height:1.15;color:#fffdf8;">Your receipt is ready.</h1>
          <p style="margin:0 0 22px;font-size:14px;line-height:22px;color:rgba(255,253,248,.68);">Thanks for your Popsy Adonis purchase. Your order has been confirmed.</p>
          <div style="background:#050505;border:1px solid rgba(255,255,255,.10);border-radius:10px;padding:16px;margin-bottom:22px;">
            <div style="font-size:11px;color:rgba(255,253,248,.48);text-transform:uppercase;letter-spacing:.1em;">Reference</div>
            <div style="font-family:Consolas,monospace;font-size:13px;color:#fffdf8;margin-top:6px;">${escapeHtml(message.reference)}</div>
          </div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            ${itemsHtml}
            <tr>
              <td style="padding:14px 0 6px;font-size:14px;color:rgba(255,253,248,.62);">Subtotal</td>
              <td align="right" style="padding:14px 0 6px;font-size:14px;color:rgba(255,253,248,.62);">${formatNairaForEmail(message.subtotalKobo)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:14px;color:rgba(255,253,248,.62);">Transaction Fee</td>
              <td align="right" style="padding:6px 0;font-size:14px;color:rgba(255,253,248,.62);">${formatNairaForEmail(message.transactionFeeKobo)}</td>
            </tr>
            <tr>
              <td style="padding:14px 0 0;font-size:18px;font-weight:900;color:#fffdf8;">Total Payable</td>
              <td align="right" style="padding:14px 0 0;font-size:18px;font-weight:900;color:#fffdf8;">${formatNairaForEmail(message.totalKobo)}</td>
            </tr>
          </table>
        </td>
      </tr>`),
  });
}

export async function sendTicketReceipt(message: TicketMessage) {
  const ticketsHtml = message.tickets
    .map(
      (ticket, index) => `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;border:1px solid rgba(255,255,255,.10);border-radius:12px;margin:16px 0;overflow:hidden;">
          <tr>
            <td style="padding:18px;vertical-align:top;">
              <div style="font-size:11px;font-weight:900;color:#c8a24a;text-transform:uppercase;letter-spacing:.08em;">Ticket ${index + 1}</div>
              <div style="font-size:22px;line-height:1.15;font-weight:900;color:#fffdf8;margin-top:7px;">${escapeHtml(ticket.eventTitle)}</div>
              ${ticket.venue ? `<div style="font-size:13px;color:rgba(255,253,248,.6);margin-top:8px;">${escapeHtml(ticket.venue)}</div>` : ""}
              ${ticket.startsAt ? `<div style="font-size:13px;color:rgba(255,253,248,.6);margin-top:4px;">${formatDateForEmail(ticket.startsAt)}</div>` : ""}
              <div style="font-size:13px;color:rgba(255,253,248,.6);margin-top:12px;">Attendee: <strong style="color:#fffdf8;">${escapeHtml(ticket.attendeeName ?? "Guest")}</strong></div>
              <div style="margin-top:18px;">${ctaButton("Open ticket", ticket.ticketUrl)}</div>
              <div style="font-family:Consolas,monospace;font-size:11px;color:rgba(255,253,248,.42);margin-top:14px;word-break:break-all;">${escapeHtml(ticket.qrCode)}</div>
            </td>
            <td width="170" align="center" style="padding:18px;vertical-align:middle;">
              ${
                ticket.qrImageUrl
                  ? `<img src="${escapeHtml(ticket.qrImageHttpUrl ?? ticket.qrImageUrl)}" alt="Ticket QR code" width="132" height="132" style="display:block;border-radius:8px;background:#fff;padding:8px;" />`
                  : ""
              }
            </td>
          </tr>
        </table>`,
    )
    .join("");

  return sendEmail({
    to: message.to,
    subject: `Your Popsy Adonis ticket QR codes - ${message.reference}`,
    text: [
      "Your ticket purchase is confirmed.",
      "",
      `Reference: ${message.reference}`,
      "",
      "Tickets:",
      ...message.tickets.map((ticket, index) =>
        [
          `${index + 1}. ${ticket.eventTitle}`,
          `Attendee: ${ticket.attendeeName ?? "Guest"}`,
          `QR Code: ${ticket.qrCode}`,
          `Ticket URL: ${ticket.ticketUrl}`,
        ]
          .filter(Boolean)
          .join("\n"),
      ),
      "",
      `Total Payable: ${formatNairaForEmail(message.totalKobo)}`,
      "",
      "Show the QR code at the gate for validation.",
    ].join("\n"),
    html: emailShell(`
      <tr>
        <td style="padding:28px;">
          <div style="font-size:13px;font-weight:800;color:#c8a24a;text-transform:uppercase;letter-spacing:.08em;">Ticket confirmed</div>
          <h1 style="margin:8px 0 8px;font-size:28px;line-height:1.15;color:#fffdf8;">Your QR ticket is ready.</h1>
          <p style="margin:0 0 20px;font-size:14px;line-height:22px;color:rgba(255,253,248,.68);">Scan the QR code at the gate or open the ticket link below. The QR code points to your live ticket page.</p>
          <div style="font-family:Consolas,monospace;font-size:12px;color:rgba(255,253,248,.5);margin-bottom:18px;">${escapeHtml(message.reference)}</div>
          ${ticketsHtml}
          <div style="margin-top:18px;padding:14px;border-radius:10px;background:rgba(200,162,74,.10);border:1px solid rgba(200,162,74,.28);font-size:13px;line-height:20px;color:#f5f0e8;">
            Total Payable: <strong>${formatNairaForEmail(message.totalKobo)}</strong>. Keep this email available on arrival.
          </div>
        </td>
      </tr>`),
  });
}

export async function sendSubscriberBroadcast(message: SubscriberBroadcastMessage) {
  return sendEmail({
    to: message.to,
    subject: message.subject,
    text: [
      message.message,
      "",
      "You are receiving this because you joined the PA FLUX early access list.",
      "To unsubscribe, reply to this email with UNSUBSCRIBE.",
    ].join("\n"),
    html: emailShell(`
      <tr>
        <td style="padding:28px;">
          <div style="font-size:13px;font-weight:800;color:#c8a24a;text-transform:uppercase;letter-spacing:.08em;">PA FLUX update</div>
          <h1 style="margin:8px 0 18px;font-size:28px;line-height:1.15;color:#fffdf8;">${escapeHtml(message.subject)}</h1>
          ${paragraphsToHtml(message.message)}
          <div style="margin-top:22px;padding:14px;border-radius:10px;background:rgba(200,162,74,.10);border:1px solid rgba(200,162,74,.28);font-size:12px;line-height:19px;color:rgba(255,253,248,.62);">
            You are receiving this because you joined the PA FLUX early access list. To unsubscribe, reply with <strong style="color:#fffdf8;">UNSUBSCRIBE</strong>.
          </div>
        </td>
      </tr>`),
  });
}
