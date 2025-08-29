import { Octokit } from '@octokit/rest'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

async function checkRepositoryExists() {
  const orgName = process.env.ORG_NAME || ''
  const token = process.env.GITHUB_TOKEN || ''

  if (!orgName) {
    console.error('ORG_NAME is required')
    process.exit(1)
  }
  if (!token) {
    console.error('A token is required in GITHUB_TOKEN')
    process.exit(1)
  }

  const octokit = new Octokit({ auth: token })

  const configPath = path.join(process.cwd(), 'repositories.yml')
  if (!fs.existsSync(configPath)) {
    console.error('repositories.yml not found at repo root')
    process.exit(1)
  }

  const doc = yaml.load(fs.readFileSync(configPath, 'utf8')) as {
    repos?: Array<{ repository: string; teams?: string[]; permission?: string }>
  }

  const repos = doc?.repos || []
  if (!Array.isArray(repos) || repos.length === 0) {
    console.error('repositories.yml has no repos defined under "repos"')
    process.exit(1)
  }

  let hadErrors = false
  for (const entry of repos) {
    const repositoryName = entry?.repository
    if (!repositoryName) {
      hadErrors = true
      console.error('✖ An entry is missing required key "repository"')
      continue
    }

    console.log(`\nValidating ${repositoryName}`)

    try {
      await octokit.rest.repos.get({ owner: orgName, repo: repositoryName })
      console.log('  ✓ Repo exists')
    } catch (e) {
      hadErrors = true
      console.error(`  ✖ Repo not found or inaccessible: ${orgName}/${repositoryName}`)
      continue
    }
  }

  if (hadErrors) process.exit(1)
}

checkRepositoryExists().catch((e) => {
  console.error(e)
  process.exit(1)
})


