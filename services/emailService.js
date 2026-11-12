const nodemailer = require('nodemailer');
const {
    ORDER_EMAIL_FROM,
    STORE_URL,
    SUPPORT_EMAIL,
    UPI_ID,
} = require('../config/store');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SEND_TIMEOUT_MS = Math.max(3000, Number(process.env.EMAIL_SEND_TIMEOUT_MS) || 10000);

let smtpTransport = null;
let smtpTransportKey = '';

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function money(value) {
    return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function orderNumber(order) {
    const id = String(order?._id || order?.id || order?.transactionId || 'UNKNOWN');
    return `KW-${id.slice(-6).toUpperCase()}`;
}

function formatDate(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return new Date().toUTCString();
    return date.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata',
    });
}

function getEmailProvider() {
    if (String(process.env.RESEND_API_KEY || '').trim()) return 'resend';
    if (String(process.env.SMTP_HOST || '').trim()) return 'smtp';
    return 'none';
}

function isConfigured() {
    return getEmailProvider() !== 'none';
}

function getFromAddress() {
    return ORDER_EMAIL_FROM || `Kamiwear Orders <${SUPPORT_EMAIL}>`;
}

function smtpConfigKey() {
    return [
        process.env.SMTP_HOST,
        process.env.SMTP_PORT,
        process.env.SMTP_USER,
        process.env.SMTP_SECURE,
    ].join('|');
}

function getSmtpTransport() {
    const host = String(process.env.SMTP_HOST || '').trim();
    if (!host) return null;

    const key = smtpConfigKey();
    if (smtpTransport && smtpTransportKey === key) return smtpTransport;

    const port = Number(process.env.SMTP_PORT) || 587;
    const user = String(process.env.SMTP_USER || '').trim();
    const pass = String(process.env.SMTP_PASS || '');
    const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;

    smtpTransport = nodemailer.createTransport({
        host,
        port,
        secure,
        ...(user && pass ? { auth: { user, pass } } : {}),
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
        tls: { rejectUnauthorized: true },
    });
    smtpTransportKey = key;
    return smtpTransport;
}

async function withTimeout(promise, ms) {
    let timer;
    try {
        return await Promise.race([
            promise,
            new Promise((resolve, reject) => {
                timer = setTimeout(() => reject(new Error(`Email provider timed out after ${ms}ms`)), ms);
            }),
        ]);
    } finally {
        clearTimeout(timer);
    }
}

async function sendViaResend({ to, subject, html, text, replyTo }) {
    const apiKey = String(process.env.RESEND_API_KEY || '').trim();
    if (!apiKey) throw new Error('RESEND_API_KEY is not configured');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: getFromAddress(),
                to: [to],
                subject,
                html,
                text,
                reply_to: replyTo || SUPPORT_EMAIL,
            }),
            signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || data.error || `Resend responded with ${response.status}`);
        }
        return { sent: true, provider: 'resend', id: data.id || '' };
    } finally {
        clearTimeout(timer);
    }
}

async function sendViaSmtp({ to, subject, html, text, replyTo }) {
    const transport = getSmtpTransport();
    if (!transport) throw new Error('SMTP is not configured');

    const info = await withTimeout(
        transport.sendMail({
            from: getFromAddress(),
            to,
            subject,
            html,
            text,
            replyTo: replyTo || SUPPORT_EMAIL,
        }),
        SEND_TIMEOUT_MS
    );

    return { sent: true, provider: 'smtp', id: info.messageId || '' };
}

async function sendMail({ to, subject, html, text, replyTo }) {
    const recipient = String(to || '').trim().toLowerCase();
    if (!EMAIL_RE.test(recipient)) {
        return { sent: false, status: 'failed', provider: 'none', error: 'Invalid recipient email address' };
    }

    const provider = getEmailProvider();
    if (provider === 'none') {
        return {
            sent: false,
            status: 'not_configured',
            provider: 'none',
            error: 'No email provider configured (set RESEND_API_KEY or SMTP_HOST)',
        };
    }

    const payload = { to: recipient, subject, html, text, replyTo };
    const attempts = provider === 'resend' ? ['resend', 'smtp'] : ['smtp', 'resend'];
    let lastError = '';

    for (const attempt of attempts) {
        if (attempt === 'resend' && !process.env.RESEND_API_KEY) continue;
        if (attempt === 'smtp' && !process.env.SMTP_HOST) continue;

        try {
            const result = attempt === 'resend'
                ? await sendViaResend(payload)
                : await sendViaSmtp(payload);
            return { ...result, status: 'sent', error: '' };
        } catch (error) {
            lastError = error.message || String(error);
            console.error(`[Kamiwear Email] ${attempt} delivery failed for ${recipient}:`, lastError);
        }
    }

    return {
        sent: false,
        status: 'failed',
        provider,
        error: lastError || 'Email delivery failed',
    };
}

function paymentLine(order) {
    const method = String(order.paymentMethod || 'Cash on Delivery');
    if (/upi/i.test(method)) {
        return {
            title: 'UPI payment',
            lines: [
                `UPI ID: ${UPI_ID}`,
                `UTR / reference: ${order.utr || 'Not provided'}`,
                'Status: Payment pending manual verification',
            ],
            note: 'Our team will verify your UPI reference and dispatch your order after the payment is confirmed.',
        };
    }

    return {
        title: 'Cash on Delivery',
        lines: [
            `Amount due on delivery: ${money(order.totalAmount)}`,
            'Status: Pay when your order arrives',
        ],
        note: 'Please keep the exact amount ready when the delivery partner arrives.',
    };
}

function itemsHtml(order) {
    const items = Array.isArray(order.items) ? order.items : [];
    return items.map(item => {
        const quantity = Number(item.quantity) || 0;
        const lineTotal = Number(item.price || 0) * quantity;
        return `
            <tr>
                <td style="padding:12px 0;border-bottom:1px solid #ececec;font-family:Arial,sans-serif;font-size:14px;color:#111;">
                    <strong>${escapeHtml(item.name || 'Item')}</strong>
                    <div style="color:#777;font-size:12px;margin-top:3px;">${escapeHtml(item.category || 'Apparel')} &middot; Qty ${quantity}</div>
                </td>
                <td align="right" style="padding:12px 0;border-bottom:1px solid #ececec;font-family:Arial,sans-serif;font-size:14px;color:#111;white-space:nowrap;">
                    ${money(lineTotal)}
                </td>
            </tr>`;
    }).join('');
}

function shippingLines(order) {
    const shipping = order.shipping || {};
    return [
        `${shipping.firstName || ''} ${shipping.lastName || ''}`.trim(),
        shipping.address,
        shipping.apartment,
        [shipping.city, shipping.country].filter(Boolean).join(', '),
        shipping.email,
    ].filter(Boolean);
}

function buildOrderEmail(order, user) {
    const number = orderNumber(order);
    const payment = paymentLine(order);
    const shipTo = shippingLines(order);
    const total = money(order.totalAmount);
    const firstName = String(order.shipping?.firstName || user?.name || 'Shinobi').split(' ')[0];

    const subject = `Order ${number} confirmed — Kamiwear`;
    const preheader = `We received your ${order.paymentMethod || 'order'} order worth ${total}.`;

    const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#0a0812;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0812;padding:24px 12px;">
        <tr><td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;">
                <tr>
                    <td style="background:#0a0812;padding:28px 32px;border-bottom:3px solid #f2df0d;">
                        <div style="font-size:22px;font-weight:800;letter-spacing:3px;color:#ffffff;">KAMIWEAR</div>
                        <div style="margin-top:6px;font-size:11px;letter-spacing:2px;color:#f2df0d;text-transform:uppercase;">Mission confirmed</div>
                    </td>
                </tr>
                <tr>
                    <td style="padding:32px;">
                        <h1 style="margin:0 0 10px;font-size:24px;color:#111;">Thanks, ${escapeHtml(firstName)}.</h1>
                        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#444;">
                            We received your order <strong>${escapeHtml(number)}</strong>. Here are your order and payment details.
                        </p>

                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;border-radius:12px;margin-bottom:22px;">
                            <tr>
                                <td style="padding:16px 18px;font-size:13px;color:#666;">Order number</td>
                                <td align="right" style="padding:16px 18px;font-size:14px;font-weight:700;color:#111;">${escapeHtml(number)}</td>
                            </tr>
                            <tr>
                                <td style="padding:0 18px 16px;font-size:13px;color:#666;">Placed on</td>
                                <td align="right" style="padding:0 18px 16px;font-size:13px;color:#111;">${escapeHtml(formatDate(order.createdAt))}</td>
                            </tr>
                        </table>

                        <h2 style="margin:0 0 8px;font-size:14px;letter-spacing:1px;text-transform:uppercase;color:#111;">Your items</h2>
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            ${itemsHtml(order)}
                            <tr>
                                <td style="padding:14px 0 0;font-size:14px;font-weight:700;color:#111;">Total</td>
                                <td align="right" style="padding:14px 0 0;font-size:16px;font-weight:800;color:#111;white-space:nowrap;">${total}</td>
                            </tr>
                        </table>

                        <h2 style="margin:26px 0 8px;font-size:14px;letter-spacing:1px;text-transform:uppercase;color:#111;">${escapeHtml(payment.title)}</h2>
                        <div style="background:#fffbe6;border:1px solid #f2df0d;border-radius:12px;padding:16px 18px;font-size:14px;line-height:1.7;color:#333;">
                            ${payment.lines.map(line => `<div>${escapeHtml(line)}</div>`).join('')}
                            <div style="margin-top:10px;font-size:13px;color:#666;">${escapeHtml(payment.note)}</div>
                        </div>

                        <h2 style="margin:26px 0 8px;font-size:14px;letter-spacing:1px;text-transform:uppercase;color:#111;">Shipping to</h2>
                        <p style="margin:0;font-size:14px;line-height:1.7;color:#444;">
                            ${shipTo.map(escapeHtml).join('<br>') || 'Shipping details were not provided.'}
                        </p>

                        <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#777;">
                            Need help? Reply to this email or contact
                            <a href="mailto:${escapeHtml(SUPPORT_EMAIL)}" style="color:#111;">${escapeHtml(SUPPORT_EMAIL)}</a>.
                            Please include your order number.
                        </p>
                    </td>
                </tr>
                <tr>
                    <td style="background:#f2f2f2;padding:20px 32px;font-size:12px;line-height:1.6;color:#777;">
                        <a href="${escapeHtml(STORE_URL)}" style="color:#111;text-decoration:none;font-weight:700;">kamiwear</a> &middot;
                        Anime streetwear built for the next mission.<br>
                        You received this email because you placed an order at Kamiwear.
                    </td>
                </tr>
            </table>
        </td></tr>
    </table>
</body>
</html>`;

    const text = [
        `KAMIWEAR — Order ${number} confirmed`,
        '',
        `Thanks, ${firstName}. We received your order.`,
        '',
        `Order number: ${number}`,
        `Placed on: ${formatDate(order.createdAt)}`,
        '',
        'Your items:',
        ...(Array.isArray(order.items) ? order.items.map(item =>
            `- ${item.name} x${item.quantity}: ${money(Number(item.price || 0) * Number(item.quantity || 0))}`
        ) : []),
        '',
        `Total: ${total}`,
        '',
        `${payment.title}:`,
        ...payment.lines,
        payment.note,
        '',
        'Shipping to:',
        ...(shipTo.length ? shipTo : ['Shipping details were not provided.']),
        '',
        `Support: ${SUPPORT_EMAIL}`,
        STORE_URL,
    ].join('\n');

    return { subject, html, text };
}

function buildPaymentVerifiedEmail(order) {
    const number = orderNumber(order);
    const subject = `Payment verified for order ${number} — Kamiwear`;
    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"></head>
<body style="margin:0;background:#0a0812;font-family:Arial,Helvetica,sans-serif;padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:18px;overflow:hidden;">
<tr><td style="background:#0a0812;padding:26px 30px;border-bottom:3px solid #1dd75e;">
<div style="font-size:22px;font-weight:800;letter-spacing:3px;color:#fff;">KAMIWEAR</div>
<div style="margin-top:6px;font-size:11px;letter-spacing:2px;color:#1dd75e;text-transform:uppercase;">Payment verified</div>
</td></tr>
<tr><td style="padding:30px;">
<h1 style="margin:0 0 12px;font-size:23px;color:#111;">Payment confirmed.</h1>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#444;">
We verified the UPI payment for order <strong>${escapeHtml(number)}</strong> (${money(order.totalAmount)}). Your order is now being prepared for dispatch.
</p>
<p style="margin:0;font-size:14px;line-height:1.7;color:#444;">
UTR / reference: <strong>${escapeHtml(order.utr || '—')}</strong><br>
Shipping to: ${shippingLines(order).map(escapeHtml).join(', ') || '—'}
</p>
<p style="margin:24px 0 0;font-size:13px;color:#777;">Questions? Contact ${escapeHtml(SUPPORT_EMAIL)}.</p>
</td></tr>
</table></td></tr></table>
</body></html>`;

    const text = [
        `KAMIWEAR — Payment verified for order ${number}`,
        '',
        `We verified your UPI payment of ${money(order.totalAmount)}.`,
        `UTR / reference: ${order.utr || '—'}`,
        'Your order is now being prepared for dispatch.',
        '',
        `Support: ${SUPPORT_EMAIL}`,
        STORE_URL,
    ].join('\n');

    return { subject, html, text };
}

async function sendOrderConfirmation(order, user) {
    const recipient = order?.shipping?.email || user?.email || '';
    const template = buildOrderEmail(order, user);
    const result = await sendMail({
        to: recipient,
        subject: template.subject,
        html: template.html,
        text: template.text,
        replyTo: SUPPORT_EMAIL,
    });
    return { ...result, to: String(recipient).toLowerCase() };
}

async function sendPaymentVerifiedEmail(order) {
    const recipient = order?.shipping?.email || '';
    const template = buildPaymentVerifiedEmail(order);
    const result = await sendMail({
        to: recipient,
        subject: template.subject,
        html: template.html,
        text: template.text,
        replyTo: SUPPORT_EMAIL,
    });
    return { ...result, to: String(recipient).toLowerCase() };
}

module.exports = {
    isConfigured,
    getEmailProvider,
    getFromAddress,
    sendOrderConfirmation,
    sendPaymentVerifiedEmail,
    buildOrderEmail,
    buildPaymentVerifiedEmail,
    escapeHtml,
};
