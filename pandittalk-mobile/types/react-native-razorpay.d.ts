declare module 'react-native-razorpay' {
  export type RazorpayPrefill = {
    email?: string;
    contact?: string;
    name?: string;
  };

  export type RazorpayOpenOptions = {
    key: string;
    /** Integer amount in paise (e.g. ₹199 → 19900). */
    amount: number;
    currency?: string;
    name?: string;
    description?: string;
    order_id?: string;
    image?: string;
    prefill?: RazorpayPrefill;
    theme?: { color?: string };
  };

  export type RazorpaySuccessData = {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  };

  export default class RazorpayCheckout {
    static open(options: RazorpayOpenOptions): Promise<RazorpaySuccessData>;
  }
}
