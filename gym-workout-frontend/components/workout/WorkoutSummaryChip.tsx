import { Badge } from "@/components/ui/badge";
import type { WorkoutSummary } from "@/lib/types";

interface WorkoutSummaryChipProps {
  workout: WorkoutSummary;
  index: number;
  onSelect: (name: string) => void;
}

export function WorkoutSummaryChip({ workout, index, onSelect }: WorkoutSummaryChipProps) {
  return (
    <button
      onClick={() => onSelect(workout.name)}
      className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-lg border border-border bg-muted/30 hover:bg-accent hover:border-primary/40 transition-colors group"
    >
      <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground shrink-0">
        {index}.
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{workout.name}</p>
        {workout.muscleGroups.length > 0 && (
          <p className="text-xs text-muted-foreground truncate">
            {workout.muscleGroups.join(", ")}
          </p>
        )}
      </div>
      {workout.difficulty && (
        <Badge variant="secondary" className="shrink-0 text-xs">
          {workout.difficulty}
        </Badge>
      )}
      <span className="text-muted-foreground text-xs shrink-0 group-hover:text-primary">→</span>
    </button>
  );
}
