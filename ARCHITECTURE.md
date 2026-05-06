# Gym Workout AI — Complete Walkthrough

## The Big Idea

This is a **conversational fitness assistant** that turns natural language ("create a beginner chest workout with dumbbells") into real database operations. It combines four patterns into one system:

1. **LangGraph state machine** — deterministic routing instead of a free-form agent. Every user message walks through a known set of nodes, so behavior is observable and debuggable.
2. **RAG over an exercise dataset** — when creating a workout, it semantically searches 2,918 real exercises in pgvector to pick relevant ones rather than letting the LLM hallucinate.
3. **Multi-turn slot filling** — if the user is vague ("I want a workout"), the assistant remembers what's missing, asks follow-ups, and merges answers across turns using `MemorySaver` keyed by `thread_id`.
4. **Reference resolution** — workouts can be referenced by id, by an ordinal/name from a previously-listed set, or by muscle group. A dedicated resolution node handles disambiguation and asks for a selection when multiple candidates match.

## Request Flow (POST /chat)

[server.ts:13](src/server.ts#L13) receives the message and invokes the compiled graph. The state then flows:

```
START → identifyIntent → resolveUser → [route by intent + slot status]
                                            │
                                            ├─ create_workout  → RAG search + DB insert
                                            ├─ list_workouts   → DB select (+ optional muscle filter)
                                            ├─ resolveWorkout  → for update / delete / get
                                            │     │
                                            │     ├─ update_workout → DB update
                                            │     ├─ delete_workout → DB delete
                                            │     └─ get_workout    → DB select
                                            │
                                            └─ message (if missing slots, unknown intent, or done)
                                                          │
                                            ─── all paths → message → END
```

The conditional routing lives in [graph.ts:99-147](src/graph/graph.ts#L99-L147). Three short-circuits send the user straight to `message` without taking action: an `unknown` intent, missing slots after `resolveUser` (e.g. CPF), or a resolution outcome that already represents a final answer (e.g. "no match", or a list of candidates awaiting selection).

## State Schema — The Heart of the System

[graph.ts:38-74](src/graph/graph.ts#L38-L74) defines a Zod schema with these fields:

- **`messages`** — full chat history (LangGraph reducers append, never replace).
- **`intent`** — one of 5 actions or `unknown`.
- **`slots`** — extracted parameters: `workoutId`, `workoutName`, `goal`, `muscleGroups`, `equipment`, `difficulty`, `numExercises`, `userId`, `cpf`, `selectionRef`. Slots **persist across turns** because `MemorySaver` checkpoints them by `thread_id`.
- **`missingSlots`** — what still needs to be asked (e.g. `cpf`, `muscleGroups_or_goal`, `workout_reference`, `workout_selection`).
- **`retrievedExercises`** — output of the RAG step.
- **`workoutCandidates`** — list of workouts presented to the user when a reference is ambiguous (e.g. multiple chest workouts). Survives turns so the next reply ("the second one") can be resolved.
- **`actionSuccess` / `actionError` / `actionData`** — outcome of the DB operation, fed to the message generator.

This schema *is* the contract between nodes — nodes return a `Partial<GraphState>` and LangGraph merges it.

## Node-by-Node

### 1. identifyIntentNode ([identifyIntentNode.ts](src/graph/nodes/identifyIntentNode.ts))

Sends the latest user message to GPT-4o-mini with a structured-output schema. The LLM returns `{ intent, slots }`. Three important details:

- **Slot merging** ([identifyIntentNode.ts:106](src/graph/nodes/identifyIntentNode.ts#L106)): `{ ...state.slots, ...newSlots }` — never replaces, only adds. This is what makes turn 2 of "I want a workout" → "Legs, expert level" work.
- **Required slots per intent** ([identifyIntentNode.ts:6-12](src/graph/nodes/identifyIntentNode.ts#L6-L12)): `create_workout` needs muscle groups OR a goal; `update`/`delete`/`get` need a workout reference (id, muscle groups, selectionRef, or pending candidate list); `list_workouts` needs nothing.
- **Selection upgrade** ([identifyIntentNode.ts:94-102](src/graph/nodes/identifyIntentNode.ts#L94-L102)): if the previous turn was `list_workouts` with pending candidates and the user replies with only a `selectionRef`, the intent is upgraded to `get_workout`. This makes "Show all my workouts" → "the second one" resolve to opening that workout.

The prompt also encodes **CPF continuity**: when a CPF-only reply follows an assistant prompt for CPF, the prior intent is preserved instead of falling to `unknown`.

### 2. resolveUserNode ([resolveUserNode.ts](src/graph/nodes/resolveUserNode.ts))

Runs after every successful intent classification. Three branches:

- If `slots.userId` is present (e.g. injected by the HTTP layer), pass through.
- If `slots.cpf` is present, validate the 11-digit Brazilian CPF (length, check digits, no all-equal-digits trick), then call `WorkoutService.getOrCreateUserByCpf` and stamp `slots.userId`. Invalid CPFs surface as `actionError: 'invalid_cpf'` so the message node can ask again.
- Otherwise, push `cpf` onto `missingSlots` and route to `message` to ask for it.

This is what makes the assistant usable without a logged-in user — identity is established conversationally.

### 3. resolveWorkoutNode ([resolveWorkoutNode.ts](src/graph/nodes/resolveWorkoutNode.ts)) — the disambiguation node

Runs only for `update_workout`, `delete_workout`, `get_workout`. Resolves a workout reference into a concrete `workoutId`:

1. If `slots.workoutId` is already set, do nothing.
2. If `slots.selectionRef` is set and we have pending `workoutCandidates`, parse the ref. Supports numeric (`"1"`), ordinals (`"first"`..`"tenth"`, `"last"`), exact name match, and partial name match.
3. Otherwise, if `slots.muscleGroups` is set, call `WorkoutService.findWorkoutsByMuscleGroups`:
   - 0 matches → `actionError: 'no_match'`.
   - 1 match → auto-select.
   - Many matches: for `get_workout` return them as a summary list directly; for `update`/`delete` stash them in `workoutCandidates` and ask for a selection.
4. Otherwise mark `workout_reference` as missing.

`workoutCandidates` is what lets the next turn's "the second one" mean something — the candidate list is checkpointed alongside the rest of the state.

### 4. createWorkoutNode ([createWorkoutNode.ts](src/graph/nodes/createWorkoutNode.ts)) — the RAG path

The most interesting node:
1. Validates slots with a per-node Zod schema (defaults: `difficulty=Intermediate`, `numExercises=5`).
2. Calls `ragService.searchExercises(...)` to pull semantically-matched exercises from pgvector.
3. Generates a default workout name if none provided.
4. Inserts the workout + linked exercises into Postgres in a single transaction (with `rest_time_sec` defaulting to 60s).

### 5. The other action nodes
`updateWorkout`, `deleteWorkout`, `getWorkout`, `listWorkouts` are thin wrappers around `WorkoutService`. `listWorkouts` additionally supports a `muscleGroups` filter and auto-collapses single-result lists into a full workout view.

### 6. messageGeneratorNode ([messageGeneratorNode.ts](src/graph/nodes/messageGeneratorNode.ts))

The single response writer for *all* paths. It computes a "scenario" string ([messageGeneratorNode.ts:8-21](src/graph/nodes/messageGeneratorNode.ts#L8-L21)):

- `ask_for_cpf_invalid` if a CPF was rejected
- `ask_for_<slotName>` if there are missing slots (e.g. `ask_for_cpf`, `ask_for_workout_selection`)
- `unknown` if intent failed
- `no_workout_match` for empty muscle-group lookups
- `<intent>_success` or `<intent>_error` otherwise

**Deterministic shortcut** ([messageGeneratorNode.ts:30-51](src/graph/nodes/messageGeneratorNode.ts#L30-L51)): for `create_workout_success`, `get_workout_success`, and `list_workouts_success`, the node skips the LLM entirely and renders the response with [workoutFormatter.ts](src/services/workoutFormatter.ts) — `formatWorkout` for full details, `formatWorkoutSummaryList` for multi-result lists. This guarantees consistent layout and saves a token round-trip on the most common happy paths.

For every other scenario, the LLM is called with the full state context and an instruction-tuned prompt to write a friendly, context-aware reply.

## RAG Service ([ragService.ts](src/services/ragService.ts))

Built on LangChain's `PGVectorStore`:
- Embeds with OpenAI's `text-embedding-3-small` (1536 dims) **routed through OpenRouter** (so a single API key handles both LLM + embeddings).
- Builds a query string from muscle groups: `"exercises targeting chest and triceps muscles"`.
- Filters on `level` and (single) `equipment` via metadata.
- Filters out low-similarity matches (`score > 0.3`).

The vector table is shared with LangChain's defaults: `langchain_pg_embedding` with `cmetadata` JSONB column for filtering.

## Data Pipeline ([scripts/ingest.ts](scripts/ingest.ts))

Run once via `npm run ingest`:
1. Parses `megaGymDataset.csv` (2,918 rows).
2. Inserts each exercise into the `exercises` table, capturing `id` in a Map.
3. Builds LangChain `Document`s with content `"<title>. <description>"` and metadata pointing back to the SQL row (`exercise_id`, `body_part`, `equipment`, `level`, `type`).
4. Embeds in batches of 50 via OpenRouter and persists to pgvector.

This dual-write (SQL row + vector) is what lets RAG return real `exercise_id`s usable in foreign keys — the LLM never makes them up.

## Database ([schema.sql](src/db/schema.sql))

Auto-applied on first `docker-compose up`:
- `users` — includes a `cpf` column (Brazilian taxpayer ID, 11 digits, unique).
- `exercises`, `workouts`, `workout_exercises` — the join table holds `position`, `sets`, `reps`, `rest_time_sec` (default 60s), `notes`.
- A trigger maintains `workouts.updated_at`.
- `CREATE EXTENSION vector` enables pgvector.
- A demo user is seeded (`cpf = 11144477735`).

## OpenRouter Service ([openRouterService.ts](src/services/openRouterService.ts))

A thin wrapper around `ChatOpenAI` pointed at `https://openrouter.ai/api/v1`. The `generateStructured` method uses LangChain's `createAgent` + `providerStrategy(schema)` to get **schema-validated structured output** from the LLM — that's how `identifyIntent` and `messageGenerator` return typed objects instead of strings to be parsed.

## HTTP Layer ([server.ts](src/server.ts))

Fastify v5 with two surfaces:
- **`POST /chat`** — the AI path. Body needs `message` + `thread_id`; optional `user_id` is injected into slots (skipping the CPF prompt).
- **`/workouts` CRUD** — direct REST that bypasses the AI, using `WorkoutService` straight from the DB.

The `thread_id` is the *only* thing that makes multi-turn memory work — same id across requests = same checkpointed state.

## LangGraph Studio support

[langgraph.json](langgraph.json) registers the compiled graph (`./src/graph/factory.ts:graph`) so `npm run langgraph:serve` boots the LangGraph CLI dev UI for visualizing state, stepping through nodes, and replaying threads.

## What Makes the Architecture Work

- **Deterministic routing** beats a free-form agent for a small, well-defined action set — easier to test, log, and debug.
- **Slots and candidates survive turns** via MemorySaver, so the assistant can hold a half-filled form open *and* remember which list was just shown.
- **Reference resolution is its own node**, so disambiguation logic (ordinals, names, muscle-group lookups) doesn't leak into action nodes.
- **RAG grounds the LLM in real data** — exercise IDs from pgvector flow into foreign-key inserts; no hallucinated exercises end up in the DB.
- **One message generator** at the end means consistent tone whether the path was success, error, missing-slot, unknown-intent, or candidate-selection. Deterministic formatters cover the highest-traffic success cases for layout consistency.
- **Service injection** ([factory.ts](src/graph/factory.ts)) — services are constructed once and passed into node factories, making the graph easy to test with mocks.

## Quick Mental Model

> The LLM is used in only **two places**: extracting structured intent+slots at the start, and writing the final reply for non-deterministic scenarios. Everything in between — user resolution, workout reference resolution, RAG, SQL — is plain TypeScript with explicit validation. This isolates "AI risk" to two well-defined boundaries instead of letting the LLM drive the whole flow.
