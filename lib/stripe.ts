import { loadStripe, type Stripe } from "@stripe/stripe-js";

/**
 * `loadStripe` must be called once outside the React tree — calling it on every
 * render would re-download Stripe.js and reset Elements state.
 */
let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      console.error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
      return Promise.resolve(null);
    }

    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
};

/** Brand-matched Elements appearance so the card form looks native to the app. */
export const stripeAppearance = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#2B7FD0",
    colorBackground: "#ffffff",
    colorText: "#282828",
    colorDanger: "#dc2626",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    spacingUnit: "4px",
    borderRadius: "8px",
  },
  rules: {
    ".Input": {
      border: "1px solid #e5e7eb",
      boxShadow: "none",
      padding: "12px",
    },
    ".Input:focus": {
      border: "1px solid #2B7FD0",
      boxShadow: "0 0 0 3px rgba(43, 127, 208, 0.15)",
    },
    ".Label": {
      fontWeight: "500",
      color: "#4b5563",
    },
  },
};
