import { useRef, useState, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  onPass: () => void;
  onConnect: () => void;
  onBless: () => void;
  disabled?: boolean;
}

export function DiscoverySwipeSurface({ children, onPass, onConnect, onBless, disabled }: Props) {
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [hint, setHint] = useState<"pass" | "connect" | "bless" | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const intent = useRef<"horizontal" | "vertical" | null>(null);

  const reset = () => {
    setDrag({ x: 0, y: 0 });
    setHint(null);
    origin.current = null;
    intent.current = null;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    origin.current = { x: e.clientX, y: e.clientY };
    intent.current = null;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (disabled || !origin.current) return;

    const x = e.clientX - origin.current.x;
    const y = e.clientY - origin.current.y;

    // Detect scroll intent early: if vertical movement dominates, let browser handle it
    if (!intent.current) {
      const absX = Math.abs(x);
      const absY = Math.abs(y);
      // Threshold to determine intent (10px buffer to avoid jitter)
      if (absY > absX && absY > 10) {
        intent.current = "vertical";
        // Don't capture — let the page scroll naturally
        return;
      }
      if (absX > absY && absX > 10) {
        intent.current = "horizontal";
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // setPointerCapture may fail if element already released
        }
      }
    }

    // If vertical intent detected, bail out entirely
    if (intent.current === "vertical") {
      return;
    }

    // Only process drag for horizontal intent
    if (intent.current === "horizontal") {
      setDrag({ x, y });
      if (y < -36 && Math.abs(y) > Math.abs(x) * 1.08) {
        setHint("bless");
      } else if (x > 32) {
        setHint("connect");
      } else if (x < -32) {
        setHint("pass");
      } else {
        setHint(null);
      }
    }
  };

  const onPointerEnd = (e: React.PointerEvent) => {
    if (disabled || !origin.current || intent.current === "vertical") {
      reset();
      return;
    }

    const dx = e.clientX - origin.current.x;
    const dy = e.clientY - origin.current.y;
    const h = 72;
    const u = 56;

    if (dy < -u && Math.abs(dy) > Math.abs(dx) * 1.08) {
      onBless();
    } else if (dx > h) {
      onConnect();
    } else if (dx < -h) {
      onPass();
    }
    reset();
  };

  return (
    <div
      className="relative h-full w-full"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      style={{ touchAction: "pan-y" }}
    >
      <div
        className={`h-full w-full ${hint ? "duration-75" : "transition-transform duration-300 ease-out"}`}
        style={{
          transform: `translate(${drag.x * 0.85}px, ${drag.y * 0.85}px) rotate(${drag.x * 0.025}deg)`,
        }}
      >
        {children}
      </div>

      {hint === "pass" ? (
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-red-500/20 to-transparent flex items-center justify-start pl-6 pointer-events-none">
          <span className="text-red-100 font-bold text-lg rotate-[-12deg]">Release</span>
        </div>
      ) : null}
      {hint === "connect" ? (
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-emerald-500/20 to-transparent flex items-center justify-end pr-6 pointer-events-none">
          <span className="text-emerald-100 font-bold text-lg rotate-[12deg]">Invite</span>
        </div>
      ) : null}
      {hint === "bless" ? (
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-amber-500/20 to-transparent flex items-start justify-center pt-6 pointer-events-none">
          <span className="text-amber-100 font-bold text-lg">Bless</span>
        </div>
      ) : null}
    </div>
  );
}
