import { Inbox } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  className?: string;
  action?: React.ReactNode;
};

export function EmptyState({
  title,
  description,
  className,
  action,
}: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed bg-muted/20", className)}>
      <CardHeader className="items-start gap-4">
        <div className="rounded-full border border-border bg-background p-3 text-muted-foreground">
          <Inbox className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardHeader>
      {action ? <CardContent>{action}</CardContent> : null}
    </Card>
  );
}
