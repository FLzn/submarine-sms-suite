import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export interface PageHeaderProps {
  title: string;
  description: string;
  onAdd?: () => void;
  addLabel?: string;
}

export function PageHeader({ title, description, onAdd, addLabel }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {onAdd && addLabel && (
        <Button onClick={onAdd} className="glow-primary gap-2">
          <Plus className="w-4 h-4" />
          {addLabel}
        </Button>
      )}
    </div>
  );
}
