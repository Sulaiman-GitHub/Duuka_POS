// Shown on receipts. Override via environment variables on the host.
export const business = {
  name: process.env.BUSINESS_NAME ?? "DVN Demo Store",
  address: process.env.BUSINESS_ADDRESS ?? "Plot 1, Main Street, Kampala, Uganda",
  phone: process.env.BUSINESS_PHONE ?? "+256 700 000 000",
  footer: process.env.RECEIPT_FOOTER ?? "Thank you for shopping with us!",
};

// Cashiers may discount up to this share of a sale without a manager.
export const CASHIER_MAX_DISCOUNT_PERCENT = 10;
