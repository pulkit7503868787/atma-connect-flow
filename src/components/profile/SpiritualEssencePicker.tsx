import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { type GuruEntry, getGuruPortraitSrc } from "@/lib/onboardingOptions";

type SpiritualEssencePickerProps = {
  gurus: GuruEntry[];
  value: string;
  onChange: (guruId: string) => void;
  otherName?: string;
  onOtherNameChange?: (name: string) => void;
  className?: string;
};

export const SpiritualEssencePicker = ({
  gurus,
  value,
  onChange,
  otherName = "",
  onOtherNameChange,
  className,
}: SpiritualEssencePickerProps) => {
  const selected = useMemo(() => gurus.find((g) => g.id === value), [gurus, value]);
  const portrait = selected ? getGuruPortraitSrc(selected) : null;
  const isOther = value === "other";

  return (
    <div className={cn("space-y-5", className)}>
      <div className="relative mx-auto w-full max-w-xs">
        <div
          className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-primary/25 via-primary/8 to-transparent blur-2xl scale-110 pointer-events-none"
          aria-hidden
        />
        <div
          key={value || "empty"}
          className="relative rounded-[2rem] border border-primary/15 bg-card/60 p-6 text-center shadow-soft animate-fade-in"
        >
          <div className="mx-auto h-36 w-36 rounded-full p-1 bg-gradient-to-br from-primary/40 via-accent/30 to-primary/10 shadow-warm">
            {portrait ? (
              <img
                src={portrait}
                alt=""
                className="h-full w-full rounded-full object-cover border-2 border-background/80"
              />
            ) : (
              <div className="h-full w-full rounded-full bg-gradient-gold grid place-items-center border-2 border-background/80">
                <span className="text-4xl font-serif text-primary-foreground/90">ॐ</span>
              </div>
            )}
          </div>
          {selected ? (
            <div className="mt-5 space-y-1.5 animate-fade-in">
              <p className="font-serif text-2xl leading-tight">{selected.name}</p>
              <p className="text-xs text-muted-foreground">{selected.tradition}</p>
              {selected.lineage ? (
                <p className="text-[11px] text-foreground/75 leading-relaxed px-2">{selected.lineage}</p>
              ) : null}
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground leading-relaxed">
              Choose a guide whose presence resonates with your heart.
            </p>
          )}
        </div>
      </div>

      <div className="-mx-1 px-1">
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory">
          {gurus.map((g) => {
            const sel = value === g.id;
            const thumb = getGuruPortraitSrc(g);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => onChange(g.id)}
                className={cn(
                  "snap-start shrink-0 flex flex-col items-center gap-1.5 w-[4.5rem] transition-all",
                  sel ? "opacity-100" : "opacity-75 hover:opacity-100"
                )}
              >
                <span
                  className={cn(
                    "h-14 w-14 rounded-full overflow-hidden border-2 transition-all grid place-items-center",
                    sel ? "border-primary shadow-warm scale-105" : "border-border/60 bg-card"
                  )}
                >
                  {thumb ? (
                    <img src={thumb} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg text-primary font-serif">ॐ</span>
                  )}
                </span>
                <span
                  className={cn(
                    "text-[10px] leading-tight text-center line-clamp-2",
                    sel ? "text-primary font-medium" : "text-muted-foreground"
                  )}
                >
                  {g.shortLabel ?? g.name.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {isOther && onOtherNameChange ? (
        <input
          type="text"
          value={otherName}
          onChange={(e) => onOtherNameChange(e.target.value)}
          placeholder="Write your guide or lineage"
          className="w-full h-11 rounded-xl border border-border/60 bg-card px-3 text-sm"
        />
      ) : null}
    </div>
  );
};