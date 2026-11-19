export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ?? "";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

export interface WhatsAppRewardEventParams {
  rewardName: string;
  wheelSpun: boolean;
}

export const trackPageView = (): void => {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", "PageView");
  }
};

/**
 * Envía el evento al Pixel de Facebook al hacer clic en el botón de WhatsApp,
 * incluyendo el resultado que otorgó la ruleta.
 */
export const trackWhatsAppRewardClaim = ({
  rewardName,
  wheelSpun,
}: WhatsAppRewardEventParams): void => {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", "Contact", {
      content_name: rewardName,
      content_category: "Ruleta de la Suerte",
      reward: rewardName,
      wheel_spun: wheelSpun,
    });
  }
};
