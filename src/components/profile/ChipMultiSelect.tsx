import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { SpiritualPathGroup } from "@/lib/onboardingOptions";
import { OTHER_WRITE_ID } from "@/lib/onboardingOptions";

type ChipOption = { id: string; label: string };

type ChipMultiSelectProps = {
  groups?: SpiritualPathGroup[];
  options?: ChipOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  searchPlaceholder?: string;
  otherText?: string;
  onOtherTextChange?: (text: string) => void;
  className?: string;
};

export const ChipMultiSelect = ({
  groups,
  options,
  value,
  onChange,
  searchPlaceholder = "Search…",
  otherText = "",
  onOtherTextChange,
  className,
}: ChipMultiSelectProps) => {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const flatOptions = useMemo(() => {
    if (groups?.length) {
      return groups.flatMap((g) => g.options.map((o) => ({ ...o, group: g.group })));
    }
    return (options ?? []).map((o) => ({ ...o, group: "" }));
  }, [groups, options]);

  const filtered = useMemo(() => {
    if (!q) return flatOptions;
    return flatOptions.filter((o) => o.label.toLowerCase().includes(q) || o.group.toLowerCase().includes(q));
  }, [flatOptions, q]);

  const filteredGroups = useMemo(() => {
    if (!groups?.length) return null;
    const byGroup = new Map<string, ChipOption[]>();
    for (const o of filtered) {
      const list = byGroup.get(o.group) ?? [];
      list.push({ id: o.id, label: o.label });
      byGroup.set(o.group, list);
    }
    return [...byGroup.entries()].map(([group, opts]) => ({ group, options: opts }));
  }, [filtered, groups]);

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
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
      {flatOptions.length > 8 ? (
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-10 bg-card border-border/60 text-sm"
        />
      ) : null}

      {filteredGroups
        ? filteredGroups.map(({ group, options: opts }) =>
            opts.length ? (
              <div key={group} className="space-y-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{group}</p>
                {renderChips(opts)}
              </div>
            ) : null
          )
        : renderChips(filtered.map(({ id, label }) => ({ id, label })))}

      {value.includes(OTHER_WRITE_ID) && onOtherTextChange ? (
        <Input
          value={otherText}
          onChange={(e) => onOtherTextChange(e.target.value)}
          placeholder="Describe your path or affiliation"
          className="h-10 bg-card border-border/60 text-sm"
        />
      ) : null}
    </div>
  );
};
