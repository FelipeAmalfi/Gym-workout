import { z } from 'zod/v3';

export const ChatBodySchema = z.object({
    message: z.string().min(2),
    thread_id: z.string().min(1),
    user_id: z.number().int().positive().optional(),
});
export type ChatBody = z.infer<typeof ChatBodySchema>;

export const ListWorkoutsQuerySchema = z.object({
    user_id: z.preprocess((v) => Number(v), z.number().int().positive()),
});
export type ListWorkoutsQuery = z.infer<typeof ListWorkoutsQuerySchema>;

export const CreateWorkoutBodySchema = z.object({
    userId: z.number().int().positive(),
    name: z.string().min(1),
    goal: z.string().optional(),
    difficulty: z.string().optional(),
    description: z.string().optional(),
    exerciseIds: z.array(z.number().int().positive()).min(1),
});
export type CreateWorkoutBody = z.infer<typeof CreateWorkoutBodySchema>;

export const UpdateWorkoutBodySchema = z.object({
    userId: z.number().int().positive(),
    name: z.string().optional(),
    goal: z.string().optional(),
    difficulty: z.string().optional(),
    description: z.string().optional(),
});
export type UpdateWorkoutBody = z.infer<typeof UpdateWorkoutBodySchema>;

export const WorkoutIdParamsSchema = z.object({
    id: z.preprocess((v) => Number(v), z.number().int().positive()),
});
export type WorkoutIdParams = z.infer<typeof WorkoutIdParamsSchema>;

export const DeleteWorkoutQuerySchema = z.object({
    user_id: z.preprocess((v) => Number(v), z.number().int().positive()),
});
export type DeleteWorkoutQuery = z.infer<typeof DeleteWorkoutQuerySchema>;
