# Skill: deploy_pr

## Purpose
Determine semver bump, bump `package.json`, commit the bump on `dev`, and open a release PR from `dev` → `main`.

## Target Branch
ALWAYS: `--base main`
NEVER: `dev`, `master`

---

## Semver Bump Rules

| Commit type(s) present in `git log main..dev` | Bump    |
|-----------------------------------------------|---------|
| `feat!:` or `BREAKING CHANGE` in body         | `major` |
| `feat:` (any)                                  | `minor` |
| Only `fix:`, `refactor:`, `chore:`, `docs:`, `test:` | `patch` |

When in doubt, default to `patch`.

---

## Version Bump Command

Never edit `package.json` manually. Always use:

```bash
npm version <patch|minor|major> --no-git-tag-version
```

`--no-git-tag-version` prevents npm from creating a git tag — tag will be created after merge to main if needed.

---

## Version Bump Commit

After bumping, commit only `package.json`:

```bash
git add package.json
git commit -m "chore: bump version to <new-version>"
git push origin dev
```

---

## PR Title Format

```
release: v<new-version>
```

Examples:
```
release: v1.1.0
release: v1.0.3
release: v2.0.0
```

---

## PR Description Template

```markdown
## Release v<new-version>

**Type:** <major | minor | patch>
**Previous version:** v<old-version>

## What's Included

### Features
- <commit message> (<short-hash>)

### Fixes
- <commit message> (<short-hash>)

### Other
- <chore/docs/refactor/test commits> (<short-hash>)

## Deploy Notes

<optional: migration steps, env var changes, breaking changes, infra notes>
```

Rules:
- Omit sections that have no commits (e.g. no Features → skip that section)
- Use short hash from `git log --oneline` output
- Deploy Notes: omit entirely if nothing operational changed
- Total: under 400 words

---

## GitHub CLI Command

```powershell
& "C:\Program Files\GitHub CLI\gh.exe" pr create `
  --base main `
  --title "release: v<new-version>" `
  --body @'
## Release v<new-version>
...
'@
```

---

## Pre-flight Checklist

1. `git log main..dev --oneline` — at least one commit ahead of main
2. Read current version from `package.json`
3. Determine bump type from commit list
4. `npm version <bump> --no-git-tag-version`
5. `git add package.json && git commit -m "chore: bump version to <v>"` 
6. `git push origin dev`
7. Open PR with `gh pr create --base main`
8. Print the PR URL

---

## Future Extensions (do not implement now)

- Auto-create git tag on `main` after merge
- Generate `CHANGELOG.md` entry
- Link GitHub Issues mentioned in commits (`Closes #N`)
- Add `--label release` automatically
- Trigger deploy workflow via `gh workflow run`
