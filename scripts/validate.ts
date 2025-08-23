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

  const repositoriesDir = path.join(process.cwd(), 'repositories')
  const configFiles = fs
    .readdirSync(repositoriesDir)
    .filter((file) => file.endsWith('.yml'))

  let hadErrors = false

  for (const configFile of configFiles) {
    const configPath = path.join(repositoriesDir, configFile)
    const config = yaml.load(fs.readFileSync(configPath, 'utf8')) as {
      repository: string
    }

    const repositoryName = config?.repository
    if (!repositoryName) {
      hadErrors = true
      console.error(`✖ ${configFile}: missing required key "repository"`)
      continue
    }

    console.log(`\nValidating ${repositoryName} (${configFile})`)

    // Check repository exists
    try {
      await octokit.rest.repos.get({ owner: orgName, repo: repositoryName })
      console.log(`  ✓ Repo exists`)
    } catch (e) {
      hadErrors = true
      console.error(`  ✖ Repo not found or inaccessible: ${orgName}/${repositoryName}`)
      continue
    }
  }

  if (hadErrors) {
    process.exit(1)
  }
}

checkRepositoryExists().catch((e) => {
  console.error(e)
  process.exit(1)
})


