import type { UserProfile } from "@/lib/db";
import { cn } from "@/lib/utils";

type SealProps = {
  status: UserProfile["verification_status"];
  className?: string;
};

/**
 * Sacred verification mark — Om / seal aesthetic, not a social “blue tick”.
 * Full admin workflow is not wired yet; this reflects `verification_status` when verified.
 */
export const SacredVerificationSeal = ({ status, className }: SealProps) => {
  const verified = status === "verified";
  const pending = status === "pending";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium tracking-wide",
        verified && "border-amber-600/35 bg-gradient-to-r from-amber-500/12 via-amber-400/8 to-amber-600/15 text-amber-950/90 shadow-sm",
        pending && "border-primary/25 bg-primary/5 text-primary",
        !verified && !pending && "border-dashed border-muted-foreground/35 bg-muted/30 text-muted-foreground",
        className
      )}
      title={verified ? "Sacred verification complete" : pending ? "Verification in gentle review" : "Sacred verification — coming when you request it"}
    >
      <span
        className={cn(
          "grid h-7 w-7 shrink-0 place-items-center rounded-full border text-sm leading-none font-serif",
          verified && "border-amber-600/40 bg-amber-100/60 text-amber-900",
          pending && "border-primary/30 bg-card text-primary",
          !verified && !pending && "border-muted-foreground/25 bg-card text-muted-foreground"
        )}
        aria-hidden
      >
        ॐ
      </span>
      <span className="text-left leading-tight">
        {verified ? (
          <>
            <span className="block uppercase tracking-[0.18em] text-[9px] opacity-80">Verified seeker</span>
            <span className="block font-serif text-xs">Sacred verification</span>
          </>
        ) : pending ? (
          <>
            <span className="block uppercase tracking-[0.18em] text-[9px] opacity-80">In review</span>
            <span className="block font-serif text-xs">Sacred verification</span>
          </>
        ) : (
          <>
            <span className="block uppercase tracking-[0.18em] text-[9px] opacity-80">Placeholder</span>
            <span className="block font-serif text-xs">Sacred seal reserved</span>
          </>
        )}
      </span>
    </div>
  );
};
