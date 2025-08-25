# repo-access-manager
Manage access to repositories for teams present in org

## How it works
- Edit the YAML file at repo root: `repositories.yml`.
- Open a PR with your change. A validation check confirms each target repository exists.
- After the PR is merged to `main`, an automated sync grants/removes the declared permissions.

## repositories.yml format
```yaml
repos:
  - repository: my-repo
    teams:
      - staff
      - maintainer
    permission: push
```

Allowed permission values:
- pull, triage, push, maintain, admin

Notes:
- Use the team slug (lowercase, hyphenated), not the display name.
- If you use `write`, it will be normalized to `push`.

## Request access to a repository
1. Edit `repositories.yml` and add an entry under `repos` with your repository, teams, and permission.
2. Open a PR targeting `main`.
3. Once the PR is approved and merged, the sync action will apply the requested access.

## Remove a team’s access from a repository
1. Edit `repositories.yml` and remove the team slug from that repo’s `teams` list.
2. If you want to remove all teams for that repo, set an empty list:
```yaml
repos:
  - repository: my-repo
    teams: []
    permission: push
```
3. Open a PR. After it’s merged to `main`, the sync action will remove the team(s) from the repo.

