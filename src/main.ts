import core from '@actions/core'
import {GitHub} from '@actions/github'

function parseClubhouseIds(str: string) {
  const regex = /\Wch([0-9]+)[\W$]/g
  const ids = []
  let match = regex.exec(str)
  while (match !== null) {
    ids.push(match[1])
    match = regex.exec(str)
  }
  return ids
}

function convertClubhouseIdsToLinks(chunk: string, workspace: string) {
  const clubhouseIds = parseClubhouseIds(chunk)
  clubhouseIds.forEach(id => {
    chunk = chunk.replace(
      `ch${id}`,
      `[ch${id}](https://app.clubhouse.io/${workspace}/story/${id})`
    )
  })
  return chunk
}

function convertTickets(text: string, options: {clubhouseWorkspace?: string}) {
  let result = text
  if (options.clubhouseWorkspace) {
    result = convertClubhouseIdsToLinks(text, options.clubhouseWorkspace)
  }
  return result
}

async function run() {
  const {GITHUB_SHA, GITHUB_REPOSITORY} = process.env

  if (!GITHUB_SHA) {
    core.setFailed('Could not detect GITHUB_SHA environment variable')
    return
  }

  if (!GITHUB_REPOSITORY) {
    core.setFailed('Could not detect GITHUB_REPOSITORY environment variable')
    return
  }

  const [owner, repo] = GITHUB_REPOSITORY.split('/')
  const token = core.getInput('githubToken', {required: true})
  const autoVersion = core.getInput('autoVersion') === 'true'
  const clubhouseWorkspace = core.getInput('clubhouse')
  const octokit = new GitHub(token)

  const {data: prs} = await octokit.repos.listPullRequestsAssociatedWithCommit({
    owner,
    repo,
    commit_sha: GITHUB_SHA
  })

  if (!prs.length) {
    core.info('No Pull Requests linked to this commit')
    return
  }

  const {data: allReleases} = await octokit.repos.listReleases({owner, repo})
  const latestDraft = allReleases.find(release => release.draft)
  const latestRelease = allReleases.find(release => !release.draft)

  const version =
    parseInt(latestRelease?.tag_name.toLowerCase().replace('v', '') ?? '0') ?? 0
  const newVersion = `v${version + 1}`
  const tag_name = autoVersion ? newVersion : 'draft'
  const name = autoVersion ? newVersion : 'Draft Release'
  const lines: string[] = []

  if (latestDraft) {
    lines.push(latestDraft.body)
  }

  let release_id = latestDraft?.id

  if (!release_id) {
    core.info('No current draft release found. Creating new draft.')
    const {data: newDraft} = await octokit.repos.createRelease({
      owner,
      repo,
      draft: true,
      tag_name,
      name
    })
    release_id = newDraft.id
    lines.push('**Pull Requests in this Release**\n')
  }

  prs.forEach(pr => {
    const title = convertTickets(pr.title, {clubhouseWorkspace})
    lines.push(`- ${title} ([#${pr.number}](${pr.html_url}))`)
  })

  core.info(
    `Updating release id: ${release_id} with reference to ${prs.length} pull requests`
  )

  const body = lines.join('\n')

  await octokit.repos.updateRelease({owner, repo, tag_name, release_id, body})
}

try {
  run()
} catch (e) {
  core.setFailed(`Action failed with error ${e}`)
}
