// components/VideoProcessingCard.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw, Clock, AlertTriangle } from "lucide-react";

type VideoProcessingCardProps = {
  startedAt?: string | null;
  onRetry?: () => void;
  className?: string;
  label?: string;
  description?: string;
};

// Encoding a short pitch takes seconds. If it has been spinning far longer than
// that, say so instead of spinning forever with no explanation.
const STALLED_AFTER_MS = 5 * 60 * 1000;

export function VideoProcessingCard({
  startedAt,
  onRetry,
  className,
  label,
  description,
}: VideoProcessingCardProps) {
  const startedLabel = startedAt ? new Date(startedAt).toLocaleString() : null;
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    if (!startedAt) return;
    const check = () => {
      const elapsed = Date.now() - new Date(startedAt).getTime();
      setStalled(Number.isFinite(elapsed) && elapsed > STALLED_AFTER_MS);
    };
    check();
    const timer = setInterval(check, 30_000);
    return () => clearInterval(timer);
  }, [startedAt]);

  return (
    <Card className={`border-dashed ${className ?? ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <CardTitle className="text-base">
            {label ?? "Processing your video…"}
          </CardTitle>
        </div>
        <CardDescription className="text-sm">
          {description ??
            "Your elevator pitch is being encoded and will appear here automatically."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-4 w-4" />
            {startedLabel ? <>Started at {startedLabel}</> : <>Encoding in progress</>}
          </div>

          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Check again
            </Button>
          )}
        </div>

        {stalled && (
          <div className="flex items-start gap-2 rounded-md bg-amber-50 p-2 text-xs text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              This is taking longer than usual. You can keep waiting, or delete
              the video and upload it again.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
