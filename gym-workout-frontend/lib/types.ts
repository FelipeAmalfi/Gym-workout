export type Intent =
  | "create_workout"
  | "update_workout"
  | "delete_workout"
  | "get_workout"
  | "list_workouts"
  | "unknown";

export type Difficulty = "Beginner" | "Intermediate" | "Expert";

export interface Exercise {
  id: number;
  title: string;
  description: string | null;
  bodyPart: string | null;
  equipment: string | null;
  level: string | null;
  sets: number;
  reps: number;
  restTimeSec: number;
  position: number;
}

export interface Workout {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  goal: string | null;
  difficulty: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutWithExercises extends Workout {
  exercises: Exercise[];
}

export interface WorkoutSummary {
  id: number;
  name: string;
  goal: string | null;
  difficulty: string | null;
  muscleGroups: string[];
}

export interface ChatRequest {
  message: string;
  thread_id: string;
  user_id?: number;
}

export interface ChatResponse {
  reply: string;
  intent: Intent;
  missingSlots?: string[];
  actionSuccess?: boolean;
  actionData?: WorkoutWithExercises | WorkoutSummary[] | Workout | null;
}

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  intent?: Intent;
  actionData?: ChatResponse["actionData"];
  actionSuccess?: boolean;
  timestamp: Date;
}
