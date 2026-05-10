import { Badge } from "@/components/ui/badge";
import { ExerciseItem } from "@/components/workout/ExerciseItem";
import type { WorkoutWithExercises } from "@/lib/types";

interface WorkoutCardProps {
  workout: WorkoutWithExercises;
}

const difficultyVariant = (d: string | null) => {
  if (d === "Beginner") return "success";
  if (d === "Expert") return "destructive";
  return "secondary";
};

export function WorkoutCard({ workout }: WorkoutCardProps) {
  const sorted = [...workout.exercises].sort((a, b) => a.position - b.position);

  return (
    <div className="mt-3 rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-foreground leading-tight">
            {workout.name}
          </h3>
          <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
            {workout.difficulty && (
              <Badge variant={difficultyVariant(workout.difficulty)}>
                {workout.difficulty}
              </Badge>
            )}
            {workout.goal && (
              <Badge variant="outline">{workout.goal.replace(/_/g, " ")}</Badge>
            )}
          </div>
        </div>
        {workout.description && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {workout.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          {sorted.length} exercise{sorted.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="px-4 divide-y divide-border">
        {sorted.map((ex, i) => (
          <ExerciseItem key={ex.id} exercise={ex} index={i + 1} />
        ))}
      </div>
    </div>
  );
}
