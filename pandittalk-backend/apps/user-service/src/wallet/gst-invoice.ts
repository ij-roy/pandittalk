/** GST included in the recharge price the customer already paid. */
export const GST_PERCENT = 18;

export type GstInvoiceInput = {
  transactionId: string;
  paidAt: Date;
  amountInr: number;
  coinsAmount: number;
  paymentReference: string | null;
  buyerName: string;
  sellerName: string;
  sellerGstin: string | null;
  sellerAddress: string | null;
};

export type GstInvoice = {
  invoiceNumber: string;
  taxableInr: string;
  gstInr: string;
  totalInr: string;
  text: string;
};

export function invoiceNumberFor(transactionId: string): string {
  const compact = transactionId.replace(/-/g, '').slice(0, 8).toUpperCase();
  return `PT-${compact}`;
}

/** Split a GST-inclusive rupee amount into taxable value and tax, in paise. */
export function splitInclusiveGst(amountInr: number): { taxablePaise: number; gstPaise: number; totalPaise: number } {
  const totalPaise = Math.round(amountInr * 100);
  if (!Number.isFinite(totalPaise) || totalPaise <= 0) {
    throw new Error('Invoice amount must be a positive rupee value');
  }
  const taxablePaise = Math.round((totalPaise * 100) / (100 + GST_PERCENT));
  return {
    taxablePaise,
    gstPaise: totalPaise - taxablePaise,
    totalPaise,
  };
}

export function formatInrPaise(paise: number): string {
  const sign = paise < 0 ? '-' : '';
  const abs = Math.abs(paise);
  const rupees = Math.floor(abs / 100);
  const rem = abs % 100;
  return `${sign}₹${rupees}.${String(rem).padStart(2, '0')}`;
}

function formatPaidAt(paidAt: Date): string {
  return paidAt.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function buildGstInvoice(input: GstInvoiceInput): GstInvoice {
  const split = splitInclusiveGst(input.amountInr);
  const invoiceNumber = invoiceNumberFor(input.transactionId);
  const taxableInr = formatInrPaise(split.taxablePaise);
  const gstInr = formatInrPaise(split.gstPaise);
  const totalInr = formatInrPaise(split.totalPaise);
  const sellerLines = [
    input.sellerName.trim() || 'PanditTalk',
    input.sellerAddress?.trim() || null,
    input.sellerGstin?.trim() ? `GSTIN ${input.sellerGstin.trim()}` : null,
  ].filter(Boolean);

  const lines = [
    ...sellerLines,
    '',
    'Tax invoice',
    `Invoice ${invoiceNumber}`,
    `Date ${formatPaidAt(input.paidAt)} IST`,
    'Status Paid',
    '',
    `Billed to ${input.buyerName.trim() || 'Customer'}`,
    '',
    'Coin wallet recharge',
    'Price includes GST. Tax is not split into CGST and SGST because the place of supply is not stored on the payment.',
    `Taxable value ${taxableInr}`,
    `GST @ ${GST_PERCENT}% ${gstInr}`,
    `Total paid ${totalInr}`,
    `Coins credited ${input.coinsAmount}`,
    input.paymentReference?.trim() ? `Payment reference ${input.paymentReference.trim()}` : null,
    '',
    'Coins fund live consultations on PanditTalk.',
  ].filter((line): line is string => line !== null);

  return {
    invoiceNumber,
    taxableInr,
    gstInr,
    totalInr,
    text: lines.join('\n'),
  };
}
