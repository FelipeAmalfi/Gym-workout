# Skill: prompt_generation

## Purpose
Write or modify system/user prompt templates for intent classification or message generation.

## Scope
- `src/shared/prompts/v1/identifyIntent.ts` — `getSystemPrompt()`, `getUserPromptTemplate()`, Zod output schema
- `src/shared/prompts/v1/messageGenerator.ts` — `getSystemPrompt()`, `getUserPromptTemplate()`, scenarios

## Inputs
New intent to document, new message scenario, modified extraction rules, additional examples.

## Outputs
Updated `getSystemPrompt()` and/or `getUserPromptTemplate()` in one or both prompt files.

## Constraints
Both `getSystemPrompt()` functions return `JSON.stringify(object)`. Both `getUserPromptTemplate()` functions return `JSON.stringify({ scenario, details })` or similar. Extraction rules in `identifyIntent.ts` must cover all slots in `SlotsSchema`. Scenarios in `messageGenerator.ts` must correspond to string values produced by `resolveScenario()` in `messageGeneratorNode.ts`. Never expose numeric DB IDs in message prompts.

## Related Files
- `src/interface/graph/nodes/messageGeneratorNode.ts` (`resolveScenario` function)
