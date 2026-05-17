import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { SpiritualPathGroup } from "@/lib/onboardingOptions";
import { isOtherWriteOptionId, OTHER_WRITE_ID } from "@/lib/onboardingOptions";

type ChipOption = { id: string; label: string };

export type OtherFieldConfig = {
  text: string;
  onTextChange: (value: string) => void;
  placeholder?: string;
};

type ChipMultiSelectProps = {
  groups?: SpiritualPathGroup[];
  options?: ChipOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  /** Legacy single “Other” field (flat options). */
  otherText?: string;
  onOtherTextChange?: (text: string) => void;
  otherPlaceholder?: string;
  /** Per-option “Other” fields (grouped paths: core vs traditions). */
  otherFields?: Record<string, OtherFieldConfig>;
  className?: string;
};

export const ChipMultiSelect = ({
  groups,
  options,
  value,
  onChange,
  otherText = "",
  onOtherTextChange,
  otherPlaceholder = "Share in your own words",
  otherFields,
  className,
}: ChipMultiSelectProps) => {
  const flatOptions = useMemo(() => {
    if (groups?.length) {
      return groups.flatMap((g) => g.options.map((o) => ({ ...o, group: g.group })));
    }
    return (options ?? []).map((o) => ({ ...o, group: "" }));
  }, [groups, options]);

  const grouped = useMemo(() => {
    if (!groups?.length) return null;
    return groups.map((g) => ({ group: g.group, options: g.options }));
  }, [groups]);

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };

  const renderOtherInput = (optionId: string) => {
    const field = otherFields?.[optionId];
    if (field && value.includes(optionId)) {
      return (
        <Input
          value={field.text}
          onChange={(e) => field.onTextChange(e.target.value)}
          placeholder={field.placeholder ?? otherPlaceholder}
          className="h-10 bg-card border-border/60 text-sm"
        />
      );
    }
    if (
      optionId === OTHER_WRITE_ID &&
      onOtherTextChange &&
      value.includes(OTHER_WRITE_ID) &&
      !otherFields
    ) {
      return (
        <Input
          value={otherText}
          onChange={(e) => onOtherTextChange(e.target.value)}
          placeholder={otherPlaceholder}
          className="h-10 bg-card border-border/60 text-sm"
        />
      );
    }
    return null;
  };

  const renderChips = (opts: ChipOption[]) => (
    <div className="flex flex-wrap gap-2">
      {opts.map((o) => {
        const sel = value.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => toggle(o.id)}
            className={cn(
              "px-3 py-2 rounded-full border text-xs font-medium transition-all text-left",
              sel ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/60 hover:border-primary/40"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={cn("space-y-3", className)}>
      {grouped
        ? grouped.map(({ group, options: opts }) => {
            const otherOpt = opts.find((o) => isOtherWriteOptionId(o.id));
            return opts.length ? (
              <div key={group} className="space-y-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{group}</p>
                {renderChips(opts)}
                {otherOpt ? renderOtherInput(otherOpt.id) : null}
              </div>
            ) : null;
          })
        : (
          <>
            {renderChips(flatOptions.map(({ id, label }) => ({ id, label })))}
            {value.includes(OTHER_WRITE_ID) ? renderOtherInput(OTHER_WRITE_ID) : null}
          </>
        )}
    </div>
  );
};
