import { Octokit } from '@octokit/rest'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

const ORG_NAME = process.env.ORG_NAME || ''

type GithubPermission = 'pull' | 'triage' | 'push' | 'maintain' | 'admin'

function normalizePermission(input: string): GithubPermission {
  const map: Record<string, GithubPermission> = {
    read: 'pull',
    pull: 'pull',
    triage: 'triage',
    write: 'push',
    push: 'push',
    maintain: 'maintain',
    admin: 'admin',
  }
  const normalized = map[input?.toLowerCase?.() as string]
  if (!normalized) {
    throw new Error(
      `Invalid permission "${input}". Use one of: pull | triage | push | maintain | admin`,
    )
  }
  return normalized
}

async function syncRepositoryAccess() {
  if (!ORG_NAME) {
    console.error('ORG_NAME is required')
    process.exit(1)
  }
  if (!process.env.GITHUB_TOKEN) {
    console.error('GITHUB_TOKEN is required')
    process.exit(1)
  }

  // Resolve from repo root so it works in CI
  const reposDir = path.join(process.cwd(), 'repositories')
  const configFiles = fs.readdirSync(reposDir).filter((file) => file.endsWith('.yml'))

  let hadErrors = false

  for (const configFile of configFiles) {
    let config: { repository: string; teams: string[]; permission: string }
    try {
      config = yaml.load(
        fs.readFileSync(path.join(reposDir, configFile), 'utf8'),
      ) as { repository: string; teams: string[]; permission: string }
    } catch (e) {
      hadErrors = true
      console.error(`❌ Failed to read/parse ${configFile}: ${(e as Error).message}`)
      continue
    }
    const { repository, teams, permission } = config
    const normalizedPermission = normalizePermission(permission)

    console.log(`🔄 Processing ${repository}...`)

    try {
      // Get current team permissions for this repository
      const { data: currentTeams } = await octokit.rest.repos.listTeams({
        owner: ORG_NAME,
        repo: repository,
      })

      // Desired vs current
      const desiredTeams = new Set(teams)
      const currentTeamSlugs = new Set(currentTeams.map((team) => team.slug))

      // Add or update permissions for desired teams
      for (const teamSlug of desiredTeams) {
        if (!currentTeamSlugs.has(teamSlug)) {
          try {
            await octokit.rest.teams.addOrUpdateRepoPermissionsInOrg({
              org: ORG_NAME,
              team_slug: teamSlug,
              owner: ORG_NAME,
              repo: repository,
              permission: normalizedPermission,
            })
            console.log(`  ✅ Added ${teamSlug} with ${normalizedPermission} access`)
          } catch (error) {
            hadErrors = true
            console.error(
              `  ❌ Failed to add ${teamSlug}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            )
          }
        } else {
          await octokit.rest.teams.addOrUpdateRepoPermissionsInOrg({
            org: ORG_NAME,
            team_slug: teamSlug,
            owner: ORG_NAME,
            repo: repository,
            permission: normalizedPermission,
          })
          console.log(`  🔄 Updated ${teamSlug} permission to ${normalizedPermission}`)
        }
      }

      // Remove teams not desired anymore
      for (const currentTeam of currentTeams) {
        if (!desiredTeams.has(currentTeam.slug)) {
          try {
            await octokit.rest.teams.removeRepoInOrg({
              org: ORG_NAME,
              team_slug: currentTeam.slug,
              owner: ORG_NAME,
              repo: repository,
            })
            console.log(`  🗑️ Removed ${currentTeam.slug} access`)
          } catch (error) {
            hadErrors = true
            console.error(
              `  ❌ Failed to remove ${currentTeam.slug}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            )
          }
        }
      }
    } catch (error) {
      hadErrors = true
      console.error(
        `❌ Error processing ${repository}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  if (hadErrors) {
    process.exit(1)
  }
}

syncRepositoryAccess()


