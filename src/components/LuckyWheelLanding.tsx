"use client";

import { useEffect, useRef, useState } from "react";
import { trackWhatsAppRewardClaim } from "@/lib/fpixel";

interface WheelReward {
  id: string;
  label: string;
  promoCode: string;
  shortBenefit: string;
  playWithMin: string;
  playWithVip: string;
  /** Ángulo (0-359) para que la flecha superior apunte al centro del segmento */
  targetOffsetDeg: number;
}

interface DepositOption {
  id: "min" | "vip";
  buttonLabel: string;
  amountText: string;
  amountValue: number;
}

interface CachedSpinState {
  spunAt: number;
  rewardId: string;
  rotation: number;
}

const STORAGE_KEY = "tukibet_wheel_spin_state_v1";
const COOLDOWN_MS = 60 * 60 * 1000; // 1 hora

const DEPOSIT_OPTIONS: DepositOption[] = [
  {
    id: "min",
    buttonLabel: "Activar con carga mínima ($2.000)",
    amountText: "$2.000",
    amountValue: 2000,
  },
  {
    id: "vip",
    buttonLabel: "Activar con carga VIP ($5.000 o más)",
    amountText: "$5.000",
    amountValue: 5000,
  },
];

const WHEEL_REWARDS: WheelReward[] = [
  {
    id: "extra50",
    label: "50% EXTRA EN TU PRIMERA CARGA",
    promoCode: "TUKI50",
    shortBenefit: "el 50% extra",
    playWithMin: "Cargás $2.000 y jugás con $3.000",
    playWithVip: "Cargás $5.000 y jugás con $7.500",
    targetOffsetDeg: 247.5,
  },
  {
    id: "extra30_spins",
    label: "30% EXTRA + 10 GIROS CON TU CARGA",
    promoCode: "TUKI30G",
    shortBenefit: "el 30% extra + 10 giros con mi carga",
    playWithMin: "Cargás $2.000 y jugás con $2.600 + 10 giros",
    playWithVip: "Cargás $5.000 y jugás con $6.500 + 10 giros",
    targetOffsetDeg: 202.5,
  },
  {
    id: "extra25",
    label: "25% EXTRA EN TU DEPÓSITO",
    promoCode: "TUKI25",
    shortBenefit: "el 25% extra en mi depósito",
    playWithMin: "Cargás $2.000 y jugás con $2.500",
    playWithVip: "Cargás $5.000 y jugás con $6.250",
    targetOffsetDeg: 157.5,
  },
  {
    id: "cashback20",
    label: "CASHBACK 20% EN TU PRIMER JUGADA",
    promoCode: "TUKICB20",
    shortBenefit: "el cashback 20% en mi primer jugada",
    playWithMin: "Cargás $2.000 con 20% de respaldo",
    playWithVip: "Cargás $5.000 con 20% de respaldo",
    targetOffsetDeg: 112.5,
  },
  {
    id: "duplica",
    label: "DUPLICAMOS TU PRIMERA CARGA",
    promoCode: "TUKI100",
    shortBenefit: "el 100% extra para duplicar mi primera carga",
    playWithMin: "Cargás $2.000 y jugás con $4.000",
    playWithVip: "Cargás $5.000 y jugás con $10.000",
    targetOffsetDeg: 337.5,
  },
  {
    id: "extra30",
    label: "30% EXTRA EN TU DEPÓSITO",
    promoCode: "TUKI30",
    shortBenefit: "el 30% extra en mi depósito",
    playWithMin: "Cargás $2.000 y jugás con $2.600",
    playWithVip: "Cargás $5.000 y jugás con $6.500",
    targetOffsetDeg: 292.5,
  },
];

function checkIsLocalEnvironment(): boolean {
  if (process.env.NODE_ENV === "development") return true;
  if (typeof window === "undefined") return false;
  const { hostname } = window.location;
  return hostname === "localhost" || hostname === "127.0.0.1";
}

interface LuckyWheelLandingProps {
  whatsappNumber: string;
}

export default function LuckyWheelLanding({
  whatsappNumber,
}: LuckyWheelLandingProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonReward, setWonReward] = useState<WheelReward | null>(null);
  const [rotation, setRotation] = useState(0);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositOption | null>(
    null
  );
  const [isLockedByCooldown, setIsLockedByCooldown] = useState(false);
  const [isLocal, setIsLocal] = useState(
    process.env.NODE_ENV === "development"
  );

  const winnerCardRef = useRef<HTMLDivElement>(null);

  // Recuperar estado guardado en caché (localStorage) solo fuera de local
  useEffect(() => {
    const localEnv = checkIsLocalEnvironment();
    setIsLocal(localEnv);

    if (localEnv) {
      return;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as Partial<CachedSpinState>;
      if (
        typeof parsed.spunAt !== "number" ||
        typeof parsed.rewardId !== "string"
      ) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }

      const isWithinCooldown = Date.now() - parsed.spunAt < COOLDOWN_MS;

      if (isWithinCooldown) {
        const savedReward =
          WHEEL_REWARDS.find((r) => r.id === parsed.rewardId) ?? null;
        if (savedReward) {
          setWonReward(savedReward);
          setRotation(
            typeof parsed.rotation === "number"
              ? parsed.rotation
              : savedReward.targetOffsetDeg
          );
        }
        setIsLockedByCooldown(true);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignorar errores de acceso a localStorage
    }
  }, []);

  const sanitizedPhone = whatsappNumber.replace(/\D/g, "");
  const whatsappMessage =
    wonReward && selectedDeposit
      ? `Hola! Gané el código ${wonReward.promoCode} en la ruleta. Quiero hacer mi primera carga de ${selectedDeposit.amountText} para activar ${wonReward.shortBenefit}.`
      : "";
  const whatsappHref = `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  const handleSpin = () => {
    if (isSpinning || (!isLocal && isLockedByCooldown)) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const selectedReward =
      WHEEL_REWARDS[Math.floor(Math.random() * WHEEL_REWARDS.length)];

    const spunAt = Date.now();
    const extraSpins = prefersReducedMotion ? 0 : 5 * 360;
    const baseRotation = Math.ceil(rotation / 360) * 360;
    const nextRotation =
      baseRotation + extraSpins + selectedReward.targetOffsetDeg;

    // En producción guardar en caché para limitar a 1 giro por hora
    if (!isLocal) {
      try {
        const stateToCache: CachedSpinState = {
          spunAt,
          rewardId: selectedReward.id,
          rotation: nextRotation,
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToCache));
      } catch {
        // Ignorar errores de localStorage
      }
    }

    setSelectedDeposit(null);
    setIsSpinning(true);
    setRotation(nextRotation);

    const finishDelay = prefersReducedMotion ? 150 : 4700;

    window.setTimeout(() => {
      setIsSpinning(false);
      setWonReward(selectedReward);
      if (!isLocal) {
        setIsLockedByCooldown(true);
      }

      window.requestAnimationFrame(() => {
        if (winnerCardRef.current) {
          winnerCardRef.current.scrollIntoView({
            behavior: prefersReducedMotion ? "auto" : "smooth",
            block: "center",
          });
        }
      });
    }, finishDelay);
  };

  const handleWhatsAppClick = () => {
    if (!wonReward || !selectedDeposit) return;

    trackWhatsAppRewardClaim({
      rewardName: wonReward.label,
      promoCode: wonReward.promoCode,
      depositAmount: selectedDeposit.amountValue,
      depositLabel: selectedDeposit.amountText,
      wheelSpun: true,
    });
  };

  const showWinnerCard = Boolean(wonReward) && !isSpinning;
  const isButtonDisabled = isSpinning || (!isLocal && isLockedByCooldown);

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
              ¡Multiplicá{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200">
                Tu Suerte!
              </span>
            </h1>
            <p className="text-sky-200 text-sm md:text-base mt-2 max-w-xl mx-auto font-medium">
              Girá la ruleta y desbloqueá un porcentaje extra exclusivo para tu
              primer depósito en TukiBet.
            </p>
          </div>

          {/* Layout: Centered wheel before spin; 2-column layout once won */}
          <div
            className={
              showWinnerCard
                ? "grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
                : "flex flex-col items-center justify-center"
            }
          >
            {/* LEFT COLUMN: Hidden until the wheel finishes spinning */}
            {showWinnerCard && wonReward && (
              <div className="lg:col-span-6 flex flex-col items-center lg:items-end space-y-6 order-2 lg:order-1">
                <div
                  ref={winnerCardRef}
                  data-purpose="winner-card"
                  className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-4 border-sky-400 ring-4 ring-amber-400 relative overflow-hidden text-slate-800 transition-all"
                >
                  {/* Subtle Argentine Stripe Top Edge */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-sky-400 via-white to-sky-400" />

                  <div className="flex items-center gap-5">
                    {/* Mascot avatar inside card */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 bg-sky-50 rounded-2xl overflow-hidden border-2 border-sky-200 shadow-inner flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="Carpincho Ganador"
                        className="w-full h-full object-cover"
                        src="/carpincho.jpg"
                      />
                    </div>

                    {/* Winning Reward Header */}
                    <div className="flex-1">
                      <span className="text-xs font-black uppercase text-sky-600 tracking-wider">
                        Código {wonReward.promoCode} desbloqueado
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-tukiorange leading-tight uppercase mt-1">
                        {wonReward.label}
                      </div>
                    </div>
                  </div>

                  {/* Mini-Filter: Choose deposit amount to unlock WhatsApp */}
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <p className="text-xs sm:text-sm font-bold text-[#0a274c] mb-3">
                      Elegí con cuánto querés activar tu beneficio:
                    </p>
                    <div className="flex flex-col gap-2.5">
                      {DEPOSIT_OPTIONS.map((option) => {
                        const isSelected = selectedDeposit?.id === option.id;
                        const playWithText =
                          option.id === "min"
                            ? wonReward.playWithMin
                            : wonReward.playWithVip;

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setSelectedDeposit(option)}
                            aria-pressed={isSelected}
                            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition cursor-pointer flex flex-col ${
                              isSelected
                                ? "border-tukiorange bg-orange-50 shadow-sm"
                                : "border-slate-200 bg-slate-50 hover:border-sky-400 hover:bg-sky-50/50"
                            }`}
                          >
                            <span
                              className={`font-extrabold text-sm ${
                                isSelected
                                  ? "text-tukiorange"
                                  : "text-[#0a274c]"
                              }`}
                            >
                              {option.buttonLabel}
                            </span>
                            <span className="text-xs font-semibold text-slate-500 mt-0.5">
                              {playWithText}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reclamar en WhatsApp Button — Only shown after selecting a deposit tier */}
                  {selectedDeposit && (
                    <div className="mt-5">
                      <a
                        id="whatsapp-claim-link"
                        href={whatsappHref}
                        onClick={handleWhatsAppClick}
                        rel="noopener noreferrer"
                        target="_blank"
                        className="w-full bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.99] text-white font-extrabold text-base py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-3 transition"
                      >
                        <span className="uppercase tracking-wide">
                          Activar en WhatsApp
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
                  )}
                </div>
              </div>
            )}

            {/* RIGHT COLUMN (or Centered): Interactive Wheel Showcase */}
            <div
              className={
                showWinnerCard
                  ? "lg:col-span-6 flex flex-col items-center justify-center order-1 lg:order-2"
                  : "flex flex-col items-center justify-center w-full"
              }
            >
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
                    {/* The Spinning Wheel SVG with 8 deposit-multiplier segments */}
                    <svg
                      id="fortune-wheel"
                      viewBox="0 0 400 400"
                      className="w-full h-full select-none"
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        transition: isSpinning
                          ? "transform 4.5s cubic-bezier(0.12, 0.8, 0.2, 1)"
                          : "none",
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

                      {/* Segment Text Labels — Zero "plata gratis", all deposit-based */}
                      <g
                        fill="#FFFFFF"
                        fontFamily="var(--font-montserrat), 'Montserrat', sans-serif"
                        fontSize="8.5"
                        fontWeight="900"
                        textAnchor="middle"
                      >
                        {/* Seg 1: 50% EXTRA 1ª CARGA */}
                        <g transform="rotate(22.5 200 200)">
                          <text
                            fill="#FFFFFF"
                            fontSize="9"
                            transform="rotate(90 295 195)"
                            x="295"
                            y="195"
                          >
                            50% EXTRA
                          </text>
                          <text
                            fill="#FFED4A"
                            fontSize="7.5"
                            transform="rotate(90 310 195)"
                            x="310"
                            y="195"
                          >
                            1ª CARGA
                          </text>
                        </g>

                        {/* Seg 2: 30% EXTRA +10 GIROS CARGA */}
                        <g transform="rotate(67.5 200 200)">
                          <text
                            fill="#FFFFFF"
                            fontSize="8"
                            transform="rotate(90 290 195)"
                            x="290"
                            y="195"
                          >
                            30% EXTRA
                          </text>
                          <text
                            fill="#74ACDF"
                            fontSize="7"
                            transform="rotate(90 306 195)"
                            x="306"
                            y="195"
                          >
                            +10 GIROS CARGA
                          </text>
                        </g>

                        {/* Seg 3: 25% EXTRA EN TU DEPÓSITO */}
                        <g transform="rotate(112.5 200 200)">
                          <text
                            fill="#FFFFFF"
                            transform="rotate(90 295 195)"
                            x="295"
                            y="195"
                          >
                            25% EXTRA
                          </text>
                          <text
                            fill="#FFFFFF"
                            fontSize="7"
                            transform="rotate(90 310 195)"
                            x="310"
                            y="195"
                          >
                            EN TU DEPÓSITO
                          </text>
                        </g>

                        {/* Seg 4: CASHBACK 20% PRIMER JUGADA */}
                        <g transform="rotate(157.5 200 200)">
                          <text
                            fill="#FFFFFF"
                            fontSize="8"
                            transform="rotate(90 295 195)"
                            x="295"
                            y="195"
                          >
                            CASHBACK 20%
                          </text>
                          <text
                            fill="#FFB800"
                            fontSize="7"
                            transform="rotate(90 310 195)"
                            x="310"
                            y="195"
                          >
                            PRIMER JUGADA
                          </text>
                        </g>

                        {/* Seg 5: INTENTÁ DE NUEVO */}
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

                        {/* Seg 6: INTENTÁ DE NUEVO */}
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

                        {/* Seg 7: DUPLICÁ TU PRIMERA CARGA */}
                        <g transform="rotate(292.5 200 200)">
                          <text
                            fill="#FFFFFF"
                            fontSize="8.5"
                            transform="rotate(90 295 195)"
                            x="295"
                            y="195"
                          >
                            DUPLICÁ TU
                          </text>
                          <text
                            fill="#FFFFFF"
                            fontSize="7.5"
                            transform="rotate(90 310 195)"
                            x="310"
                            y="195"
                          >
                            PRIMERA CARGA
                          </text>
                        </g>

                        {/* Seg 8: 30% EXTRA EN TU DEPÓSITO */}
                        <g transform="rotate(337.5 200 200)">
                          <text
                            fill="#FFFFFF"
                            transform="rotate(90 295 195)"
                            x="295"
                            y="195"
                          >
                            30% EXTRA
                          </text>
                          <text
                            fill="#FFB800"
                            fontSize="7"
                            transform="rotate(90 310 195)"
                            x="310"
                            y="195"
                          >
                            EN TU DEPÓSITO
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
                    disabled={isButtonDisabled}
                    onClick={handleSpin}
                    className={`${
                      isButtonDisabled ? "" : "pulse-scale"
                    } w-full bg-gradient-to-r from-[#FF6B00] via-[#FF8500] to-[#E55300] hover:from-[#e05e00] hover:to-[#cc4900] active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer text-white font-black text-xl sm:text-2xl py-4 px-8 rounded-2xl shadow-glow-orange border-2 border-amber-300 uppercase tracking-wider flex items-center justify-center gap-3 transition`}
                  >
                    {isSpinning ? (
                      <span>¡Girando la Suerte...!</span>
                    ) : !isLocal && isLockedByCooldown ? (
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
                    Válido únicamente con tu primera carga. Retiros inmediatos
                    24/7.
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
