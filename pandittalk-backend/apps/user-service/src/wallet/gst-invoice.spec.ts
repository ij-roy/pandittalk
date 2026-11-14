import { buildGstInvoice, splitInclusiveGst } from './gst-invoice';

describe('splitInclusiveGst', () => {
  it('splits a GST-inclusive 118 rupee charge into 100 and 18', () => {
    expect(splitInclusiveGst(118)).toEqual({
      taxablePaise: 10000,
      gstPaise: 1800,
      totalPaise: 11800,
    });
  });

  it('keeps taxable value and tax equal to the amount paid', () => {
    const split = splitInclusiveGst(99);
    expect(split.taxablePaise + split.gstPaise).toBe(split.totalPaise);
    expect(split.totalPaise).toBe(9900);
  });

  it('rejects a zero charge', () => {
    expect(() => splitInclusiveGst(0)).toThrow(/positive/);
  });
});

describe('buildGstInvoice', () => {
  it('prints the inclusive GST lines and omits a missing GSTIN', () => {
    const invoice = buildGstInvoice({
      transactionId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      paidAt: new Date('2026-09-30T04:07:00.000Z'),
      amountInr: 118,
      coinsAmount: 100,
      paymentReference: 'pay_test',
      buyerName: 'Asha',
      sellerName: 'PanditTalk',
      sellerGstin: null,
      sellerAddress: null,
    });

    expect(invoice.invoiceNumber).toBe('PT-AAAAAAAA');
    expect(invoice.totalInr).toBe('₹118.00');
    expect(invoice.gstInr).toBe('₹18.00');
    expect(invoice.text).toContain('Tax invoice');
    expect(invoice.text).toContain('Billed to Asha');
    expect(invoice.text).toContain('Payment reference pay_test');
    expect(invoice.text).not.toContain('GSTIN');
  });
});
