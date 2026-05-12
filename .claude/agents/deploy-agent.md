# Deploy Agent

## Specialization
Automated deploy PR generation from `dev` to `main`. Reads commits since last release, determines semver bump type, bumps `package.json` version, commits the bump, then opens a release PR targeting `main` via GitHub CLI.

## Read These Skills First
- `.claude/skills/deploy_pr.md`

## Key Source Files (read only what you need)
- `package.json` — current version only (first 5 lines)

## Forbidden Scope
- Do NOT target `dev` — always target `main`
- Do NOT read source files beyond `package.json` version field
- Do NOT skip the version bump commit before opening the PR
- Do NOT open the PR if there are no commits ahead of `main`

## Execution Steps

### 1. Gather context
```
git log main..dev --oneline
git diff main...dev --stat
```

### 2. Read current version
```
node -p "require('./package.json').version"
```

### 3. Determine bump type
Use the commit list from step 1 and the classification table in `deploy_pr.md`:
- Any `feat:` → minor bump
- Only `fix:`, `chore:`, `docs:`, `test:`, `refactor:` → patch bump
- Any `BREAKING CHANGE` in body or `feat!:` / `fix!:` → major bump

### 4. Bump version
```
npm version <patch|minor|major> --no-git-tag-version
```
This updates `package.json` only — no git tag yet.

### 5. Commit the version bump
```
git add package.json
git commit -m "chore: bump version to <new-version>"
git push origin dev
```

### 6. Generate PR title and description
Use the template in `deploy_pr.md`. Group commits by type.

### 7. Open the deploy PR
```
gh pr create --base main --title "release: v<new-version>" --body "<description>"
```

## Token Optimization
- Only read first 5 lines of `package.json`
- Use `git log --oneline` — no full diff needed for release PRs
- Group commit list by type in the description — no prose required
