import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const PageHeader = ({ title, subtitle, action, back = false }: { title: string; subtitle?: string; action?: ReactNode; back?: boolean }) => {
  const nav = useNavigate();
  return (
    <header className="px-5 pt-8 pb-4 flex items-start justify-between gap-3 animate-fade-in">
      <div className="flex items-center gap-3">
        {back && (
          <button onClick={() => nav(-1)} className="h-9 w-9 rounded-full bg-secondary/70 grid place-items-center hover:bg-secondary transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div>
          <h1 className="font-serif text-3xl text-foreground leading-none">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
      {action}
    </header>
  );
};
