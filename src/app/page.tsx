import LuckyWheelLanding from "@/components/LuckyWheelLanding";

export default function HomePage() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

  return <LuckyWheelLanding whatsappNumber={whatsappNumber} />;
}
