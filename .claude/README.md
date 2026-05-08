# Claude Code Agent Index

## How to Use
Pick the agent that matches your task. Read the agent file. It lists which skill files to load and which source files to read. Do not load other files.

## Agents

| Agent | Use When |
|---|---|
| [architect-agent](agents/architect-agent.md) | Adding nodes, changing graph topology, DI wiring, layer boundaries |
| [rag-agent](agents/rag-agent.md) | pgvector search, embeddings, exercise ingestion pipeline |
| [intent-agent](agents/intent-agent.md) | New/modified intents, slot extraction, classification prompt |
| [backend-agent](agents/backend-agent.md) | Fastify routes, controllers, HTTP schemas, error handler |
| [database-agent](agents/database-agent.md) | PostgreSQL repositories, schema DDL, migrations |
| [memory-agent](agents/memory-agent.md) | LangGraph state, MemorySaver, thread_id, slot persistence |
| [prompt-agent](agents/prompt-agent.md) | Prompt templates, message scenarios, response quality |
| [refactor-agent](agents/refactor-agent.md) | Code quality, clean architecture, naming conventions |
| [api-agent](agents/api-agent.md) | New REST endpoints, request/response contracts |

## Skills (loaded by agents — do not load directly)

```
create_intent    update_intent    delete_intent
get_workout      list_workouts    workout_generation
rag_ingestion    vector_search    embeddings
memory_handling  langchain_memory slot_filling
prompt_generation  response_formatting
postgres_repository  migrations
validation       api_creation     cpf_user_flow
```

## Loading Rule
Load **one agent** per task. The agent lists which skills to `Read`. Read only those. Do not scan the full project. Skills never load other skills.

## Shared Conventions
See [CONVENTIONS.md](CONVENTIONS.md) for layer boundaries, error patterns, state rules, and naming.
