// components/VideoFailedCard.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

type VideoFailedCardProps = {
  /** Server-side reason, e.g. a duration limit or an unreadable file. */
  message?: string | null;
  onRetry?: () => void;
  className?: string;
};

/**
 * Shown when processing ended in `failed`. Without this the UI kept spinning or
 * mounted a player for a video that will never exist, leaving the user with no
 * idea what went wrong.
 */
export function VideoFailedCard({
  message,
  onRetry,
  className,
}: VideoFailedCardProps) {
  return (
    <Card className={`border-dashed border-red-300 ${className ?? ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <CardTitle className="text-base">
            We couldn&apos;t process your video
          </CardTitle>
        </div>
        <CardDescription className="text-sm">
          {message?.trim()
            ? message
            : "Something went wrong while encoding your video. Please delete it and upload again."}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex items-center justify-end">
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Check again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
