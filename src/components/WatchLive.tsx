import { ExternalLink, Tv } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const WATCH_LINKS = [
  { id: "1", name: "Stream 1", url: "https://example.co/f1/1" },
  { id: "2", name: "Stream 2", url: "https://example.com/f1/2" },
  { id: "3", name: "Stream 3", url: "https://example.net/f1/3" },
  { id: "4", name: "Stream 4", url: "https://example.org/f1/4" },
] as const;

export function WatchLive() {
  return (
    <div
      className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
      role="list"
      aria-label="External live streams"
    >
      {WATCH_LINKS.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "group flex flex-col items-start gap-2 rounded-lg border border-line bg-surface p-4",
            "transition-colors duration-150",
            "hover:border-accent/50 hover:bg-surface-hover",
          )}
          aria-label={`Watch ${link.name} — opens in new tab`}
        >
          <div className="flex items-center gap-2">
            <Tv
              className="h-4 w-4 text-muted group-hover:text-accent transition-colors"
              aria-hidden="true"
            />
            <Badge
              variant="outline"
              className="h-auto rounded-sm bg-accent px-1.5 py-px text-[9px] font-bold tracking-[0.18em] text-bg"
            >
              LIVE
            </Badge>
          </div>
          <p className="font-medium text-text group-hover:text-accent transition-colors">
            {link.name}
          </p>
          <p className="text-[11px] text-muted/70">External stream</p>
          <div className="mt-auto flex items-center justify-between w-full pt-2 border-t border-line/40">
            <span className="text-[10px] text-muted/60">
              {new URL(link.url).hostname}
            </span>
            <ExternalLink
              className="h-3.5 w-3.5 text-muted group-hover:text-accent transition-colors"
              aria-hidden="true"
            />
          </div>
        </a>
      ))}
    </div>
  );
}
