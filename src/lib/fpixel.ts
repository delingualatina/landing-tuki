export const FB_PIXEL_ID =
  process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || "2895936830782437";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

export interface WhatsAppRewardEventParams {
  rewardName: string;
  promoCode: string;
  depositAmount: number;
  depositLabel: string;
  wheelSpun: boolean;
}

export const trackPageView = (): void => {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", "PageView");
  }
};

/**
 * Envía el evento al Pixel de Facebook al hacer clic en el botón de WhatsApp,
 * incluyendo el beneficio que otorgó la ruleta y el monto de carga elegido.
 */
export const trackWhatsAppRewardClaim = ({
  rewardName,
  promoCode,
  depositAmount,
  depositLabel,
  wheelSpun,
}: WhatsAppRewardEventParams): void => {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", "Contact", {
      content_name: rewardName,
      content_category: "Ruleta de la Suerte",
      reward: rewardName,
      promo_code: promoCode,
      deposit_tier: depositLabel,
      value: depositAmount,
      currency: "ARS",
      wheel_spun: wheelSpun,
    });
  }
};
