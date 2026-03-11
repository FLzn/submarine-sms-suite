import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusBadge({ ativo }: { ativo: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium",
        ativo
          ? "border-success/40 bg-success/10 text-success"
          : "border-destructive/40 bg-destructive/10 text-destructive"
      )}
    >
      {ativo ? "Ativo" : "Inativo"}
    </Badge>
  );
}
