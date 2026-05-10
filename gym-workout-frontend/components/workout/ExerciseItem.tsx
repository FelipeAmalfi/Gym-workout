import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Exercise } from "@/lib/types";

interface ExerciseItemProps {
  exercise: Exercise;
  index: number;
}

const levelVariant = (level: string | null) => {
  if (level === "Beginner") return "success";
  if (level === "Expert") return "destructive";
  return "secondary";
};

export function ExerciseItem({ exercise, index }: ExerciseItemProps) {
  return (
    <div className="flex flex-col gap-1.5 py-3 border-b border-border last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-semibold shrink-0">
            {index}
          </span>
          <span className="text-sm font-semibold text-foreground leading-tight">
            {exercise.title}
          </span>
        </div>
        <Badge variant={levelVariant(exercise.level)}>
          {exercise.level ?? "—"}
        </Badge>
      </div>

      {exercise.description && (
        <p className="text-xs text-muted-foreground ml-8 leading-relaxed">
          {exercise.description}
        </p>
      )}

      <div className="flex flex-wrap gap-2 ml-8">
        <Chip icon="🔁" label={`${exercise.sets} × ${exercise.reps} reps`} />
        <Chip icon="⏱" label={`${exercise.restTimeSec}s rest`} />
        {exercise.bodyPart && <Chip icon="💪" label={exercise.bodyPart} />}
        {exercise.equipment && exercise.equipment !== "Body Only" && (
          <Chip icon="🏋️" label={exercise.equipment} />
        )}
      </div>
    </div>
  );
}

function Chip({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-md px-2 py-0.5">
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}
