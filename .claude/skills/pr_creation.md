# Skill: pr_creation

## Purpose
Classify a git diff, generate a conventional commit PR title and a concise description, then open a PR targeting `dev`.

## Target Branch
ALWAYS: `--base dev`
NEVER: `main`, `master`

---

## Change Type Classification

| Changed path pattern           | Conventional type |
|-------------------------------|-------------------|
| `src/interface/graph/nodes/`  | `feat` or `fix`   |
| `src/interface/http/`         | `feat` or `fix`   |
| `src/core/application/`       | `feat` or `refactor` |
| `src/core/domain/`            | `feat` or `refactor` |
| `src/infrastructure/`         | `feat` or `fix`   |
| `src/shared/prompts/`         | `feat` or `fix`   |
| `src/composition/`            | `refactor` or `chore` |
| `tests/` or `*.test.ts`       | `test`            |
| `docker*`, `render*`, `.env*` | `chore`           |
| `migrations/`                 | `chore`           |
| `README*`, `CONVENTIONS*`     | `docs`            |
| `.claude/`                    | `chore`           |

When multiple types apply, pick the dominant one based on largest diff hunk.

---

## PR Title Format

```
<type>: <short imperative description>
```

Rules:
- lowercase
- no emojis
- max 72 characters
- use imperative mood: "add", "fix", "remove", "update", "refactor"

Examples:
```
feat: add workout summary memory node
fix: resolve session persistence on thread restart
refactor: improve rag retrieval with reranking
chore: update docker compose for render deployment
test: add e2e flow for intent classification
```

---

## PR Description Template

```markdown
## Summary

<one or two sentences explaining the goal of this change>

## What Changed

- <changed item 1>
- <changed item 2>
- <changed item 3>

## Technical Notes

<optional: non-obvious constraints, workarounds, or architectural decisions>
```

Rules:
- Summary: max 2 sentences
- What Changed: bullet points only, no sub-bullets
- Technical Notes: omit section entirely if nothing non-obvious
- Total: under 300 words

---

## GitHub CLI Command

```bash
gh pr create \
  --base dev \
  --title "<title>" \
  --body "$(cat <<'EOF'
## Summary

<summary>

## What Changed

- <item>

## Technical Notes

<notes>
EOF
)"
```

---

## Pre-flight Checklist

1. `git status` — no uncommitted changes (warn user if dirty)
2. `git log dev..HEAD --oneline` — at least one commit ahead of dev
3. `git push -u origin <branch>` — push if remote not set
4. `gh pr create --base dev ...` — create the PR
5. Print the PR URL returned by `gh`

---

## Future Extensions (do not implement now)

- `--label` based on type (feat→enhancement, fix→bug, chore→maintenance)
- `--reviewer` from CODEOWNERS
- `--milestone` for semantic versioning
- Changelog entry auto-append
