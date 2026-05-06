# Gym Workout AI

AI-powered workout system using LangChain, RAG, PostgreSQL (pgvector), and LangGraph.

## Features

- **Conversational AI** — chat to create, view, update, and delete workouts
- **Multi-turn slot filling** — if you leave out details, the assistant asks follow-up questions and remembers your answers across turns
- **RAG pipeline** — retrieves exercises from a 2,918-exercise dataset using semantic similarity (pgvector)
- **REST API** — direct CRUD endpoints for workouts alongside the chat interface
- **LangGraph state machine** — deterministic routing between 5 intents with observable state

## Architecture

```
POST /chat
    │
    ▼
identifyIntent (LLM)
    │
    ├─ missing slots? ──────────────────────────────┐
    │                                               │
    ├─ create_workout ─► RAG search ─► DB insert   │
    ├─ update_workout ─► DB update                  │
    ├─ delete_workout ─► DB delete                  │
    ├─ get_workout    ─► DB select                  │
    └─ list_workouts  ─► DB select all              │
                │                                   │
                └──────────► messageGenerator (LLM) ◄┘
                                      │
                                      ▼
                                  JSON response
```

State is persisted per `thread_id` via LangGraph `MemorySaver`, enabling multi-turn conversations.

## Tech Stack

| Concern | Technology |
|---------|-----------|
| Language | TypeScript (Node.js ≥ 24.10, ESM) |
| AI orchestration | LangGraph (StateGraph + MemorySaver) |
| LLM | `openai/gpt-4o-mini` via OpenRouter |
| Embeddings | `text-embedding-3-small` via OpenRouter |
| Vector store | pgvector (PostgreSQL extension) |
| Database | PostgreSQL 16 |
| HTTP server | Fastify v5 |
| Dataset | megaGymDataset.csv (2,918 exercises) |

## Project Structure

```
gym-workout-lc/
├── megaGymDataset.csv         # Source dataset
├── docker-compose.yml         # PostgreSQL + pgvector
├── scripts/
│   └── ingest.ts              # CSV → DB + pgvector (run once)
└── src/
    ├── index.ts               # Entry point
    ├── server.ts              # Fastify routes
    ├── config.ts              # Environment config
    ├── db/
    │   ├── client.ts          # pg Pool singleton
    │   └── schema.sql         # DDL (auto-applied on first docker run)
    ├── services/
    │   ├── openRouterService.ts  # LLM client (structured outputs)
    │   ├── workoutService.ts     # Workout CRUD
    │   └── ragService.ts         # pgvector similarity search
    ├── prompts/v1/
    │   ├── identifyIntent.ts     # Intent + slot extraction prompt
    │   └── messageGenerator.ts   # Response generation prompt
    └── graph/
        ├── graph.ts           # State schema + graph definition
        ├── factory.ts         # Wires services + MemorySaver
        └── nodes/
            ├── identifyIntentNode.ts
            ├── createWorkoutNode.ts
            ├── updateWorkoutNode.ts
            ├── deleteWorkoutNode.ts
            ├── getWorkoutNode.ts
            ├── listWorkoutsNode.ts
            └── messageGeneratorNode.ts
```

## Setup

### 1. Environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```ini
OPENROUTER_API_KEY=sk-or-v1-...   # https://openrouter.ai/keys
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=gymworkout
POSTGRES_USER=gym
POSTGRES_PASSWORD=gympassword
```

### 2. Start the database

```bash
npm run infra:up
```

This starts PostgreSQL 16 with pgvector. The schema (`users`, `exercises`, `workouts`, `workout_exercises`) is applied automatically on first run.

### 3. Install dependencies

```bash
npm install
```

### 4. Ingest exercises (run once)

```bash
npm run ingest
```

Reads `megaGymDataset.csv`, inserts 2,918 exercises into PostgreSQL, and embeds them into pgvector. Takes a few minutes due to the OpenRouter embedding API calls.

### 5. Start the server

```bash
npm run dev   # with file watch
npm start     # production
```

Server runs on `http://localhost:3000`.

## API Reference

### `POST /chat`

Conversational endpoint. Supports multi-turn conversations via `thread_id`.

**Request:**
```json
{
  "message": "Create a beginner chest workout with dumbbells",
  "thread_id": "user-42-session-1",
  "user_id": 1
}
```

**Response:**
```json
{
  "reply": "💪 Your \"Beginner Chest Workout\" is ready!\n\n1. Dumbbell Bench Press — 3 sets × 10 reps\n...",
  "intent": "create_workout",
  "actionSuccess": true,
  "actionData": { "id": 3, "name": "Beginner Chest Workout", "exercises": [...] }
}
```

**Supported intents:** `create_workout`, `update_workout`, `delete_workout`, `get_workout`, `list_workouts`

---

### `GET /workouts?user_id=1`

List all workouts for a user.

### `POST /workouts`

Create a workout directly (bypasses AI).

```json
{
  "userId": 1,
  "name": "My Workout",
  "goal": "muscle_gain",
  "difficulty": "Intermediate",
  "exerciseIds": [12, 45, 88]
}
```

### `PUT /workouts/:id`

Update a workout.

```json
{ "name": "Updated Name", "difficulty": "Expert" }
```

### `DELETE /workouts/:id?user_id=1`

Delete a workout.

## Usage Examples

### Single-turn (all slots provided)

```bash
curl -X POST localhost:3000/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Create an intermediate back and biceps workout, 6 exercises, with barbells",
    "thread_id": "session-1",
    "user_id": 1
  }'
```

### Multi-turn (slot filling)

```bash
# Turn 1 — vague request
curl -X POST localhost:3000/chat \
  -H 'Content-Type: application/json' \
  -d '{"message": "I want a workout", "thread_id": "session-2", "user_id": 1}'
# → "Which muscle groups would you like to target? ..."

# Turn 2 — provide missing info (same thread_id)
curl -X POST localhost:3000/chat \
  -H 'Content-Type: application/json' \
  -d '{"message": "Legs, expert level", "thread_id": "session-2", "user_id": 1}'
# → "💪 Your Expert Legs Workout is ready! ..."
```

### List and manage workouts

```bash
# List
curl 'localhost:3000/workouts?user_id=1'

# View details via chat
curl -X POST localhost:3000/chat \
  -H 'Content-Type: application/json' \
  -d '{"message": "Show me workout 3", "thread_id": "session-3", "user_id": 1}'

# Delete via chat
curl -X POST localhost:3000/chat \
  -H 'Content-Type: application/json' \
  -d '{"message": "Delete workout 3", "thread_id": "session-4", "user_id": 1}'
```

## Database Schema

```sql
users            — id, name, email
exercises        — id, title, description, type, body_part, equipment, level, rating
workouts         — id, user_id, name, goal, difficulty, created_at, updated_at
workout_exercises — workout_id, exercise_id, position, sets, reps
langchain_pg_embedding — pgvector table (auto-created by LangChain)
```

## Dataset

`megaGymDataset.csv` contains 2,918 exercises with:

| Column | Values |
|--------|--------|
| BodyPart | Abdominals, Biceps, Chest, Glutes, Hamstrings, Lats, Quadriceps, Shoulders, Triceps, ... (17 total) |
| Equipment | Barbell, Dumbbell, Body Only, Cable, Bands, Kettlebells, Machine, ... (13 total) |
| Level | Beginner, Intermediate, Expert |
| Type | Strength, Cardio, Plyometrics, Olympic Weightlifting, Powerlifting, Stretching, Strongman |

## Running Tests

```bash
npm test
```

Tests require a running PostgreSQL instance and a valid `OPENROUTER_API_KEY` in `.env`.

## Stopping Infrastructure

```bash
npm run infra:down   # stops and removes volumes
```
