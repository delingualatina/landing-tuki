"use client";

import { useRef, useState } from "react";
import { trackWhatsAppRewardClaim } from "@/lib/fpixel";

interface WheelReward {
  label: string;
  /** Ángulo (0-359) para que la flecha superior apunte al centro del segmento */
  targetOffsetDeg: number;
}

const WHEEL_REWARDS: WheelReward[] = [
  { label: "BENEFICIO +50% CARGA", targetOffsetDeg: 247.5 },
  { label: "FREEBET $1000", targetOffsetDeg: 202.5 },
  { label: "BENEFICIO SORPRESA", targetOffsetDeg: 157.5 },
  { label: "BENEFICIO SORPRESA", targetOffsetDeg: 112.5 },
  { label: "BENEFICIO BIENVENIDA", targetOffsetDeg: 337.5 },
  { label: "5 GIROS GRATIS", targetOffsetDeg: 292.5 },
];

interface LuckyWheelLandingProps {
  whatsappNumber: string;
}

export default function LuckyWheelLanding({
  whatsappNumber,
}: LuckyWheelLandingProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonReward, setWonReward] = useState<WheelReward | null>(null);

  const winnerCardRef = useRef<HTMLDivElement>(null);

  const sanitizedPhone = whatsappNumber.replace(/\D/g, "");
  const whatsappMessage = wonReward
    ? `Hola, gané ${wonReward.label} en la ruleta y quiero reclamarlo`
    : "Hola, quiero reclamar mi beneficio de la ruleta";
  const whatsappHref = `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  const handleSpin = () => {
    if (isSpinning) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const selectedReward =
      WHEEL_REWARDS[Math.floor(Math.random() * WHEEL_REWARDS.length)];

    setIsSpinning(true);

    const extraSpins = prefersReducedMotion ? 0 : 5 * 360;
    const baseRotation = Math.ceil(rotation / 360) * 360;
    const nextRotation =
      baseRotation + extraSpins + selectedReward.targetOffsetDeg;

    setRotation(nextRotation);

    const finishDelay = prefersReducedMotion ? 150 : 4700;

    window.setTimeout(() => {
      setIsSpinning(false);
      setWonReward(selectedReward);

      if (winnerCardRef.current) {
        winnerCardRef.current.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "center",
        });
      }
    }, finishDelay);
  };

  const handleWhatsAppClick = () => {
    trackWhatsAppRewardClaim({
      rewardName: wonReward ? wonReward.label : "Beneficio de la Ruleta",
      wheelSpun: Boolean(wonReward),
    });
  };

  return (
    <main className="w-full">
      {/* HeroMainSection */}
      <section
        className="relative stadium-bg border-b border-sky-900/40 overflow-hidden py-10 lg:py-16 min-h-screen flex items-center justify-center"
        id="ruleta"
      >
        {/* Ambient Sunburst and Stadium Lights Effect */}
        <div className="absolute inset-0 sunburst-bg pointer-events-none opacity-40" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Stadium Decorative Icons */}
        <div
          aria-hidden="true"
          className="absolute top-12 left-10 opacity-20 pointer-events-none select-none text-6xl hidden xl:block"
        >
          ⚽
        </div>
        <div
          aria-hidden="true"
          className="absolute bottom-16 right-12 opacity-20 pointer-events-none select-none text-7xl hidden xl:block"
        >
          ⚽
        </div>

        <div className="max-w-[1440px] mx-auto px-6 relative z-10 w-full">
          {/* Section Top Headline Tag */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow-md uppercase">
              ¡Descubrí tu{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200">
                Beneficio Exclusivo!
              </span>
            </h1>
            <p className="text-sky-200 text-sm md:text-base mt-2 max-w-xl mx-auto font-medium">
              Girá la Rueda de la Suerte y asegurá tu beneficio garantizado hoy
              mismo.
            </p>
          </div>

          {/* Desktop Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* LEFT COLUMN: Winner Result Card, Mascot & WhatsApp Claim */}
            <div className="lg:col-span-6 flex flex-col items-center lg:items-start space-y-6 order-2 lg:order-1">
              <div
                ref={winnerCardRef}
                data-purpose="winner-card"
                className={`w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-4 border-sky-400 relative overflow-hidden text-slate-800 transition-all ${
                  wonReward ? "ring-4 ring-amber-400" : ""
                }`}
              >
                {/* Subtle Argentine Stripe Top Edge */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-sky-400 via-white to-sky-400" />

                <div className="flex items-center gap-5">
                  {/* Mascot avatar inside card */}
                  <div className="w-28 h-28 flex-shrink-0 bg-sky-50 rounded-2xl overflow-hidden border-2 border-sky-200 shadow-inner flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt="Carpincho Ganador"
                      className="w-full h-full object-cover"
                      src="/carpincho.jpg"
                    />
                  </div>

                  {/* Dynamic Reward text block */}
                  <div className="flex-1">
                    {wonReward ? (
                      <div className="text-xl sm:text-2xl font-black text-tukiorange leading-tight uppercase">
                        {wonReward.label}
                      </div>
                    ) : (
                      <div className="text-base sm:text-lg font-extrabold text-[#0a274c] leading-tight">
                        Girá la ruleta para descubrir tu beneficio
                      </div>
                    )}
                  </div>
                </div>

                {/* Reclamar en WhatsApp Button */}
                <div className="mt-6">
                  <a
                    id="whatsapp-claim-link"
                    href={whatsappHref}
                    onClick={handleWhatsAppClick}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="w-full bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.99] text-white font-extrabold text-base py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-3 transition"
                  >
                    <span className="uppercase tracking-wide">
                      Reclamar en WhatsApp
                    </span>
                    <svg
                      aria-hidden="true"
                      className="w-6 h-6 fill-current"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.964 9.964 0 0 0 1.333 4.993L2 22l5.233-1.371a9.994 9.994 0 0 0 4.779 1.218h.004c5.505 0 9.987-4.48 9.989-9.985A10.005 10.005 0 0 0 12.012 2zm.003 18.271h-.003a8.31 8.31 0 0 1-4.237-1.157l-.304-.18-3.146.825.839-3.067-.198-.315a8.275 8.275 0 0 1-1.272-4.393c.002-4.582 3.73-8.31 8.315-8.31a8.286 8.286 0 0 1 5.882 2.434 8.287 8.287 0 0 1 2.434 5.884c-.002 4.583-3.73 8.313-8.31 8.313zm4.558-6.222c-.25-.125-1.478-.729-1.707-.812-.229-.083-.396-.125-.562.125-.167.25-.646.812-.792.979-.146.167-.292.188-.542.063-.25-.125-1.055-.389-2.01-1.24a7.48 7.48 0 0 1-1.39-1.727c-.146-.25-.016-.385.109-.51.112-.112.25-.292.375-.438.125-.146.167-.25.25-.417.083-.167.042-.313-.021-.438-.063-.125-.562-1.354-.771-1.854-.204-.488-.411-.422-.562-.43-.146-.008-.312-.01-.479-.01-.167 0-.438.063-.667.313-.229.25-.875.854-.875 2.083 0 1.229.896 2.417 1.021 2.583.125.167 1.763 2.693 4.271 3.777.597.258 1.064.412 1.428.528.6.191 1.146.164 1.578.101.481-.07 1.478-.604 1.687-1.188.208-.583.208-1.083.146-1.188-.063-.104-.229-.167-.479-.292z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive Wheel Showcase */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center order-1 lg:order-2">
              <div className="relative w-full max-w-[500px] flex flex-col items-center">
                {/* Pointer Arrow on Top */}
                <div className="z-30 -mb-5 flex flex-col items-center">
                  <div
                    className="w-10 h-10 bg-gradient-to-b from-tukiorange to-red-600 shadow-xl border-2 border-white rounded-t-sm"
                    style={{ clipPath: "polygon(50% 100%, 0 0, 100% 0)" }}
                  />
                  <div className="w-3 h-3 bg-amber-200 rounded-full -mt-9 shadow-md" />
                </div>

                {/* Wheel Graphic Container */}
                <div className="relative w-[340px] h-[340px] sm:w-[440px] sm:h-[440px] rounded-full p-3 bg-gradient-to-tr from-amber-500 via-tukiorange to-yellow-400 shadow-glow-wheel border-4 border-white/80">
                  {/* Inner Light Pegs Border */}
                  <div className="w-full h-full rounded-full border-4 border-dashed border-sky-900/40 p-1 flex items-center justify-center relative overflow-hidden bg-sky-950">
                    {/* The Spinning Wheel SVG with 8 segments */}
                    <svg
                      id="fortune-wheel"
                      viewBox="0 0 400 400"
                      className="w-full h-full select-none"
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        transition: isSpinning
                          ? "transform 4.5s cubic-bezier(0.12, 0.8, 0.2, 1)"
                          : "transform 0.7s ease-out",
                      }}
                      aria-label="Rueda de la Suerte"
                      role="img"
                    >
                      <defs>
                        <filter
                          height="140%"
                          id="shadow"
                          width="140%"
                          x="-20%"
                          y="-20%"
                        >
                          <feDropShadow
                            dx="0"
                            dy="2"
                            floodOpacity="0.3"
                            stdDeviation="3"
                          />
                        </filter>
                      </defs>

                      {/* 8 Segments (45 degrees each) */}
                      <path
                        d="M200,200 L341.42,58.58 A200,200 0 0,1 400,200 Z"
                        fill="#FF7A00"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                      <path
                        d="M200,200 L400,200 A200,200 0 0,1 341.42,341.42 Z"
                        fill="#0D3B66"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                      <path
                        d="M200,200 L341.42,341.42 A200,200 0 0,1 200,400 Z"
                        fill="#FF8500"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                      <path
                        d="M200,200 L200,400 A200,200 0 0,1 58.58,341.42 Z"
                        fill="#0A2A4E"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                      <path
                        d="M200,200 L58.58,341.42 A200,200 0 0,1 0,200 Z"
                        fill="#FF7A00"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                      <path
                        d="M200,200 L0,200 A200,200 0 0,1 58.58,58.58 Z"
                        fill="#0D3B66"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                      <path
                        d="M200,200 L58.58,58.58 A200,200 0 0,1 200,0 Z"
                        fill="#FF9E00"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                      <path
                        d="M200,200 L200,0 A200,200 0 0,1 341.42,58.58 Z"
                        fill="#082240"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />

                      {/* Segment Text Labels */}
                      <g
                        fill="#FFFFFF"
                        fontFamily="var(--font-montserrat), 'Montserrat', sans-serif"
                        fontSize="9"
                        fontWeight="900"
                        textAnchor="middle"
                      >
                        <g transform="rotate(22.5 200 200)">
                          <text
                            fill="#FFFFFF"
                            fontSize="8"
                            transform="rotate(90 295 195)"
                            x="295"
                            y="195"
                          >
                            BENEFICIO +50%
                          </text>
                          <text
                            fill="#FFED4A"
                            fontSize="8"
                            transform="rotate(90 310 195)"
                            x="310"
                            y="195"
                          >
                            CARGA
                          </text>
                        </g>

                        <g transform="rotate(67.5 200 200)">
                          <text
                            fill="#FFFFFF"
                            transform="rotate(90 290 195)"
                            x="290"
                            y="195"
                          >
                            FREEBET
                          </text>
                          <text
                            fill="#74ACDF"
                            transform="rotate(90 306 195)"
                            x="306"
                            y="195"
                          >
                            $1000
                          </text>
                        </g>

                        <g transform="rotate(112.5 200 200)">
                          <text
                            fill="#FFFFFF"
                            transform="rotate(90 295 195)"
                            x="295"
                            y="195"
                          >
                            BENEFICIO
                          </text>
                          <text
                            fill="#FFFFFF"
                            transform="rotate(90 310 195)"
                            x="310"
                            y="195"
                          >
                            SORPRESA
                          </text>
                        </g>

                        <g transform="rotate(157.5 200 200)">
                          <text
                            fill="#FFFFFF"
                            transform="rotate(90 295 195)"
                            x="295"
                            y="195"
                          >
                            BENEFICIO
                          </text>
                          <text
                            fill="#FFB800"
                            transform="rotate(90 310 195)"
                            x="310"
                            y="195"
                          >
                            SORPRESA
                          </text>
                        </g>

                        <g transform="rotate(202.5 200 200)">
                          <text
                            fill="#FFFFFF"
                            transform="rotate(90 295 195)"
                            x="295"
                            y="195"
                          >
                            INTENTÁ
                          </text>
                          <text
                            fill="#FFFFFF"
                            transform="rotate(90 310 195)"
                            x="310"
                            y="195"
                          >
                            DE NUEVO
                          </text>
                        </g>

                        <g transform="rotate(247.5 200 200)">
                          <text
                            fill="#FFFFFF"
                            transform="rotate(90 295 195)"
                            x="295"
                            y="195"
                          >
                            INTENTÁ
                          </text>
                          <text
                            fill="#74ACDF"
                            transform="rotate(90 310 195)"
                            x="310"
                            y="195"
                          >
                            DE NUEVO
                          </text>
                        </g>

                        <g transform="rotate(292.5 200 200)">
                          <text
                            fill="#FFFFFF"
                            transform="rotate(90 295 195)"
                            x="295"
                            y="195"
                          >
                            BENEFICIO
                          </text>
                          <text
                            fill="#FFFFFF"
                            transform="rotate(90 310 195)"
                            x="310"
                            y="195"
                          >
                            BIENVENIDA
                          </text>
                        </g>

                        <g transform="rotate(337.5 200 200)">
                          <text
                            fill="#FFFFFF"
                            transform="rotate(90 295 195)"
                            x="295"
                            y="195"
                          >
                            5 GIROS
                          </text>
                          <text
                            fill="#FFB800"
                            transform="rotate(90 310 195)"
                            x="310"
                            y="195"
                          >
                            GRATIS
                          </text>
                        </g>
                      </g>
                    </svg>

                    {/* Center Wheel Hub */}
                    <div className="absolute w-24 h-24 rounded-full bg-gradient-to-b from-sky-400 to-[#0A2A4E] p-1.5 shadow-2xl flex items-center justify-center border-2 border-white z-20 pointer-events-none">
                      <div className="w-full h-full rounded-full bg-[#FF7A00] flex flex-col items-center justify-center text-center p-1 border border-amber-200">
                        <span className="text-[9px] font-black uppercase text-white leading-none tracking-tighter">
                          RUEDA
                        </span>
                        <span className="text-[8px] font-bold text-amber-100 leading-none">
                          DE LA
                        </span>
                        <span className="text-[9px] font-black uppercase text-white leading-none tracking-tighter">
                          SUERTE
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Action CTA */}
                <div className="w-full max-w-sm mt-8 flex flex-col items-center">
                  <button
                    type="button"
                    id="spin-button"
                    disabled={isSpinning}
                    onClick={handleSpin}
                    className={`${
                      isSpinning ? "" : "pulse-scale"
                    } w-full bg-gradient-to-r from-[#FF6B00] via-[#FF8500] to-[#E55300] hover:from-[#e05e00] hover:to-[#cc4900] active:scale-95 disabled:opacity-90 disabled:cursor-not-allowed cursor-pointer text-white font-black text-2xl py-4 px-8 rounded-2xl shadow-glow-orange border-2 border-amber-300 uppercase tracking-wider flex items-center justify-center gap-3 transition`}
                  >
                    {isSpinning ? (
                      <span>¡Girando la Suerte...!</span>
                    ) : wonReward ? (
                      <>
                        <svg
                          aria-hidden="true"
                          className="w-7 h-7 text-amber-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span>¡Beneficio Desbloqueado!</span>
                      </>
                    ) : (
                      <>
                        <svg
                          aria-hidden="true"
                          className="w-7 h-7 text-amber-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                          />
                        </svg>
                        <span>¡Girar Ahora!</span>
                      </>
                    )}
                  </button>
                  <p className="text-xs text-sky-200/80 font-medium text-center mt-3">
                    Solo para nuevos usuarios mayores de 18 años. T&amp;C
                    aplican.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
