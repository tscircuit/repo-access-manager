# repo-access-manager
Manage access to repositories for teams present in org

## How it works
- Edit YAML files in `repositories/` to declare which teams should have access to which repos and at what permission level.
- Open a PR with your change. A validation check confirms the target repository exists.
- After the PR is merged to `main`, an automated sync grants/removes the declared permissions.

## Request access to a repository
1. Create or edit a YAML file under `repositories/` named after the repository (any name is fine, one file per repo is recommended).
2. Add your team slug to the `teams` list and set the `permission`.

Example:
```yaml
repository: my-repo
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

3. Open a PR targeting `main` with your YAML change.
4. Once the PR is approved and merged, the sync action will apply the requested access.

## Remove a team’s access from a repository
1. Edit the repo’s YAML under `repositories/` and remove the team slug from `teams`.
2. If you want to remove all teams, set an empty list:
```yaml
repository: my-repo
teams: []
permission: push
```
3. Open a PR. After it’s merged to `main`, the sync action will remove the team(s) from the repo.

