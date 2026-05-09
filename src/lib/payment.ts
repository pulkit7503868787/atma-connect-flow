import { supabase } from "@/lib/supabaseClient";

const PREMIUM_AMOUNT_PAISE = 49900;

const loadRazorpayScript = async () => {
  if ((window as Window & { Razorpay?: unknown }).Razorpay) {
    return true;
  }

  return await new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const startPremiumPayment = async () => {
  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded) {
    return { ok: false, error: "Failed to load payment gateway" };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token || !session.user) {
    return { ok: false, error: "You must be logged in to upgrade" };
  }

  const orderResponse = await supabase.functions.invoke("razorpay-create-order", {
    body: { amount: PREMIUM_AMOUNT_PAISE, currency: "INR" },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (orderResponse.error || !orderResponse.data) {
    return { ok: false, error: "Could not create payment order" };
  }

  const order = orderResponse.data as {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
  };

  return await new Promise<{ ok: boolean; error?: string }>((resolve) => {
    const RazorpayCtor = (window as Window & { Razorpay: new (options: Record<string, unknown>) => { open: () => void } }).Razorpay;
    const instance = new RazorpayCtor({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "AatmamIlan",
      description: "Premium Subscription",
      order_id: order.orderId,
      prefill: {
        email: session.user.email ?? "",
      },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        const verifyResponse = await supabase.functions.invoke("razorpay-verify-payment", {
          body: response,
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (verifyResponse.error) {
          resolve({ ok: false, error: "Payment verification failed" });
          return;
        }

        resolve({ ok: true });
      },
      modal: {
        ondismiss: () => resolve({ ok: false, error: "Payment cancelled" }),
      },
      theme: {
        color: "#C17735",
      },
    });

    instance.open();
  });
};
