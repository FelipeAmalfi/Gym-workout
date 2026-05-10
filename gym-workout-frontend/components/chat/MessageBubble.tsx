"use client";

import { WorkoutCard } from "@/components/workout/WorkoutCard";
import { WorkoutSummaryChip } from "@/components/workout/WorkoutSummaryChip";
import type { ChatMessage, WorkoutWithExercises, WorkoutSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: ChatMessage;
  onWorkoutSelect?: (name: string) => void;
}

export function MessageBubble({ message, onWorkoutSelect }: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-tr-sm bg-user-bubble px-4 py-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  const isWorkoutCard =
    (message.intent === "create_workout" || message.intent === "get_workout") &&
    message.actionSuccess &&
    message.actionData &&
    !Array.isArray(message.actionData);

  const isWorkoutList =
    message.intent === "list_workouts" &&
    message.actionSuccess &&
    Array.isArray(message.actionData) &&
    message.actionData.length > 0;

  return (
    <div className="flex items-start gap-3 max-w-3xl">
      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-sm">
        🤖
      </div>
      <div className="flex-1 min-w-0">
        {message.content && (
          <div className="rounded-2xl rounded-tl-sm bg-assistant-bubble px-4 py-3 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
        )}

        {isWorkoutCard && (
          <WorkoutCard workout={message.actionData as WorkoutWithExercises} />
        )}

        {isWorkoutList && (
          <div className="mt-3 flex flex-col gap-2">
            {(message.actionData as WorkoutSummary[]).map((w, i) => (
              <WorkoutSummaryChip
                key={w.id}
                workout={w}
                index={i + 1}
                onSelect={(name) => onWorkoutSelect?.(name)}
              />
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-1 ml-1">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
