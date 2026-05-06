# Gym Workout AI — Complete Walkthrough

## The Big Idea

This is a **conversational fitness assistant** that turns natural language ("create a beginner chest workout with dumbbells") into real database operations. It combines three patterns into one system:

1. **LangGraph state machine** — deterministic routing instead of a free-form agent. Every user message walks through a known set of nodes, so behavior is observable and debuggable.
2. **RAG over an exercise dataset** — when creating a workout, it semantically searches 2,918 real exercises in pgvector to pick relevant ones rather than letting the LLM hallucinate.
3. **Multi-turn slot filling** — if the user is vague ("I want a workout"), the assistant remembers what's missing, asks follow-ups, and merges answers across turns using `MemorySaver` keyed by `thread_id`.

## Request Flow (POST /chat)

[server.ts:13](gym-workout-lc/src/server.ts#L13) receives the message and invokes the compiled graph. The state then flows:

```
START → identifyIntent → [route based on intent + missing slots]
                              │
                              ├─ create_workout  → RAG search + DB insert
                              ├─ update_workout  → DB update
                              ├─ delete_workout  → DB delete
                              ├─ get_workout     → DB select
                              ├─ list_workouts   → DB select all
                              └─ message (if missing slots or unknown intent)
                                          │
                              ─── all paths → message → END
```

The conditional routing lives in [graph.ts:81-97](gym-workout-lc/src/graph/graph.ts#L81-L97). Two short-circuits send the user straight to `message` without taking action: an `unknown` intent, or any intent where required slots are missing.

## State Schema — The Heart of the System

[graph.ts:28-60](gym-workout-lc/src/graph/graph.ts#L28-L60) defines a Zod schema with these fields:

- **`messages`** — full chat history (LangGraph reducers append, never replace).
- **`intent`** — one of 5 actions or `unknown`.
- **`slots`** — extracted parameters (workoutId, muscleGroups, equipment, difficulty, etc.). Slots **persist across turns** because `MemorySaver` checkpoints them by `thread_id`.
- **`missingSlots`** — what still needs to be asked.
- **`retrievedExercises`** — output of the RAG step.
- **`actionSuccess` / `actionError` / `actionData`** — outcome of the DB operation, fed to the message generator.

This schema *is* the contract between nodes — nodes return a `Partial<GraphState>` and LangGraph merges it.

## Node-by-Node

### 1. identifyIntentNode ([identifyIntentNode.ts](gym-workout-lc/src/graph/nodes/identifyIntentNode.ts))

Sends the latest user message to GPT-4o-mini with a structured-output schema. The LLM returns `{ intent, slots }`. Two important details:

- **Slot merging** ([identifyIntentNode.ts:59](gym-workout-lc/src/graph/nodes/identifyIntentNode.ts#L59)): `{ ...state.slots, ...newSlots }` — never replaces, only adds. This is what makes turn 2 of "I want a workout" → "Legs, expert level" work.
- **Required slots per intent** ([identifyIntentNode.ts:5-11](gym-workout-lc/src/graph/nodes/identifyIntentNode.ts#L5-L11)): create_workout needs muscle groups OR a goal; update/delete/get all need a workoutId; list needs nothing.

### 2. createWorkoutNode ([createWorkoutNode.ts](gym-workout-lc/src/graph/nodes/createWorkoutNode.ts)) — the RAG path

The most interesting node:
1. Validates slots with a per-node Zod schema (defaults: difficulty=Intermediate, numExercises=5).
2. Calls `ragService.searchExercises(...)` to pull semantically-matched exercises from pgvector.
3. Generates a default workout name if none provided.
4. Inserts the workout + linked exercises into Postgres.

### 3. The other action nodes
`updateWorkout`, `deleteWorkout`, `getWorkout`, `listWorkouts` are thin wrappers around `WorkoutService` — pure CRUD with no LLM call.

### 4. messageGeneratorNode ([messageGeneratorNode.ts](gym-workout-lc/src/graph/nodes/messageGeneratorNode.ts))

The single response writer for *all* paths. It computes a "scenario" string ([messageGeneratorNode.ts:6-15](gym-workout-lc/src/graph/nodes/messageGeneratorNode.ts#L6-L15)):

- `ask_for_<slotName>` if there are missing slots
- `unknown` if intent failed
- `<intent>_success` or `<intent>_error` otherwise

The scenario plus the full state (slots, actionData, retrievedExercises, errors) is passed to the LLM, which writes a friendly, context-aware reply. Centralizing message generation keeps tone consistent and lets every code path get the same quality of response.

## RAG Service ([ragService.ts](gym-workout-lc/src/services/ragService.ts))

Built on LangChain's `PGVectorStore`:
- Embeds with OpenAI's `text-embedding-3-small` (1536 dims) **routed through OpenRouter** (so a single API key handles both LLM + embeddings).
- Builds a query string from muscle groups: `"exercises targeting chest and triceps muscles"`.
- Filters on `level` and (single) `equipment` via metadata.
- Filters out low-similarity matches (`score > 0.3`).

The vector table is shared with LangChain's defaults: `langchain_pg_embedding` with `cmetadata` JSONB column for filtering.

## Data Pipeline ([scripts/ingest.ts](gym-workout-lc/scripts/ingest.ts))

Run once via `npm run ingest`:
1. Parses `megaGymDataset.csv` (2,918 rows).
2. Inserts each exercise into the `exercises` table, capturing `id` in a Map.
3. Builds LangChain `Document`s with content `"<title>. <description>"` and metadata pointing back to the SQL row (`exercise_id`, `body_part`, `equipment`, `level`, `type`).
4. Embeds in batches of 50 via OpenRouter and persists to pgvector.

This dual-write (SQL row + vector) is what lets RAG return real `exercise_id`s usable in foreign keys — the LLM never makes them up.

## Database ([schema.sql](gym-workout-lc/src/db/schema.sql))

Auto-applied on first `docker-compose up`:
- `users`, `exercises`, `workouts`, `workout_exercises` (the join table holds `position`, `sets`, `reps`, `notes`).
- A trigger maintains `workouts.updated_at`.
- `CREATE EXTENSION vector` enables pgvector.
- A demo user is seeded.

## OpenRouter Service ([openRouterService.ts](gym-workout-lc/src/services/openRouterService.ts))

A thin wrapper around `ChatOpenAI` pointed at `https://openrouter.ai/api/v1`. The `generateStructured` method uses LangChain's `createAgent` + `providerStrategy(schema)` to get **schema-validated structured output** from the LLM — that's how identifyIntent and messageGenerator return typed objects instead of strings to be parsed.

## HTTP Layer ([server.ts](gym-workout-lc/src/server.ts))

Fastify v5 with two surfaces:
- **`POST /chat`** — the AI path. Body needs `message` + `thread_id`; optional `user_id` is injected into slots.
- **`/workouts` CRUD** — direct REST that bypasses the AI, using `WorkoutService` straight from the DB.

The `thread_id` is the *only* thing that makes multi-turn memory work — same id across requests = same checkpointed state.

## What Makes the Architecture Work

- **Deterministic routing** beats a free-form agent for a small, well-defined action set — easier to test, log, and debug.
- **Slots survive turns** via MemorySaver, so the assistant can hold a half-filled form open.
- **RAG grounds the LLM in real data** — exercise IDs from pgvector flow into foreign-key inserts; no hallucinated exercises end up in the DB.
- **One message generator** at the end means consistent tone whether the path was success, error, missing-slot, or unknown-intent.
- **Service injection** ([factory.ts](gym-workout-lc/src/graph/factory.ts)) — services are constructed once and passed into node factories, making the graph easy to test with mocks.

## Quick Mental Model

> The LLM is used in only **two places**: extracting structured intent+slots at the start, and writing the final reply. Everything in between is plain TypeScript — pgvector queries, SQL inserts, validation. This isolates "AI risk" to two well-defined boundaries instead of letting the LLM drive the whole flow.
