import { useCallback, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  disabled?: boolean;
  onPass: () => void;
  onConnect: () => void;
  onBless: () => void;
  children: ReactNode;
};

/**
 * Subtle pan gestures on the discovery portrait — mirrors Pass / Connect / Bless without replacing buttons.
 */
export function DiscoverySwipeSurface({ disabled, onPass, onConnect, onBless, children }: Props) {
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [hint, setHint] = useState<"pass" | "connect" | "bless" | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);

  const reset = useCallback(() => {
    setDrag({ x: 0, y: 0 });
    setHint(null);
    origin.current = null;
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) {
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    origin.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || !origin.current) {
      return;
    }
    const x = e.clientX - origin.current.x;
    const y = e.clientY - origin.current.y;
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
  };

  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) {
      reset();
      return;
    }
    if (origin.current) {
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
    }
    reset();
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl">
      <div
        className={cn("relative h-full w-full transition-transform duration-200 ease-out will-change-transform", Math.hypot(drag.x, drag.y) > 2 && "duration-75")}
        style={{
          transform: `translate(${drag.x * 0.85}px, ${drag.y * 0.85}px) rotate(${drag.x * 0.025}deg)`,
        }}
      >
        {children}
        <div className="pointer-events-none absolute inset-0 transition-opacity duration-300">
          {hint === "pass" ? <div className="absolute inset-0 bg-stone-500/10" /> : null}
          {hint === "connect" ? <div className="absolute inset-0 bg-primary/12" /> : null}
          {hint === "bless" ? <div className="absolute inset-0 bg-accent/14" /> : null}
        </div>
        <div
          className="absolute inset-x-0 bottom-0 top-[28%] z-[15] cursor-grab active:cursor-grabbing touch-none select-none"
          aria-hidden
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={reset}
          style={{ touchAction: "none" }}
        />
      </div>
    </div>
  );
}
