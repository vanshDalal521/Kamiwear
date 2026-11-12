/**
 * Public store/payment configuration. Nothing in this file is a secret.
 */
const UPI_ID = String(process.env.UPI_ID || '9253395564@ybl').trim();
const UPI_PAYEE_NAME = String(process.env.UPI_PAYEE_NAME || 'Kamiwear').trim();
const UPI_QR_PATH = '/assets/payments/kamiwear-upi-scanner.png';
const STORE_URL = String(process.env.STORE_URL || 'https://kamiwear.vercel.app').replace(/\/$/, '');
const SUPPORT_EMAIL = String(process.env.KAMIWEAR_SUPPORT_EMAIL || 'orders@kamiwear.in').trim();
const ORDER_EMAIL_FROM = String(
    process.env.KAMIWEAR_EMAIL_FROM || `Kamiwear Orders <${SUPPORT_EMAIL}>`
).trim();

function getPaymentConfig() {
    return {
        cod: true,
        upi: true,
        card: false,
        simulatedCard: false,
    };
}

function getUpiConfig() {
    return {
        id: UPI_ID,
        payeeName: UPI_PAYEE_NAME,
        qrImage: UPI_QR_PATH,
        currency: 'INR',
    };
}

module.exports = {
    UPI_ID,
    UPI_PAYEE_NAME,
    UPI_QR_PATH,
    STORE_URL,
    SUPPORT_EMAIL,
    ORDER_EMAIL_FROM,
    getPaymentConfig,
    getUpiConfig,
};
