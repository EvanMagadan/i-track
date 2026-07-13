import { ChevronLeft, Wifi } from "lucide-react";

export function TopBar({
  onBack,
  backLabel = "Back",
  title = "I-Track",
  rightSlot,
}: {
  onBack?: () => void;
  backLabel?: string;
  title?: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <header className="shrink-0 border-b border-border bg-card px-4 sm:px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {onBack && (
          <>
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{backLabel}</span>
            </button>
            <div className="w-px h-5 bg-border" />
          </>
        )}
        <Wifi className="w-5 h-5 text-primary" />
        <span className="font-bold tracking-tight text-sm">{title}</span>
      </div>
      {rightSlot}
    </header>
  );
}
