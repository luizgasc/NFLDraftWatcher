import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title: string;
  description: string;
  className?: string;
};

export function ErrorState({
  title,
  description,
  className,
}: ErrorStateProps) {
  return (
    <Alert className={cn("rounded-xl", className)} variant="destructive">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{description}</AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
