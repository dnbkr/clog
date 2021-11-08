# Clog

This action stacks up reference to Pull Requests that have merged into master in a draft release, so that you can more easily write your release notes.

## Inputs

### `githubToken`

**Required** Your Github token. This is provided in your workflow environment

### `autoVersion`

Set this to `'true'` if you want the draft release to be your previous release number, plus one. Useful if you don't use semantic versioning.

### `shortcut`

Set this to your [Shortcut](https://shortcut.io) Workspace name (from the shortcut URL) if you want references to shortcut stories to be enhanced as links (e.g. if your Pull Request title looks like `Fix: major bug with frontend [sc123]` then the `[sc123]` part will be a link to the story in your release notes)

_want to see this feature with your project management tool of choice? submit a PR today!_

## Example usage

with default options:

```yaml
uses: coffeedoughnuts/clog@v1
with:
  githubToken: ${{ secrets.GITHUB_TOKEN }}
```

with auto version bumping:

```yaml
uses: coffeedoughnuts/clog@v1
with:
  githubToken: ${{ secrets.GITHUB_TOKEN }}
  autoVersion: 'true'
```

with shortcut integration:

```yaml
uses: coffeedoughnuts/clog@v1
with:
  githubToken: ${{ secrets.GITHUB_TOKEN }}
  shortcut: 'my-workspace-name'
```

You will likely want it running on every push to master. Here's an example of a complete Workflow:

```yml
name: Draft Release

on:
  push:
    branches:
      - master

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v1
      - uses: coffeedoughnuts/clog@v1
        with:
          githubToken: ${{ secrets.GITHUB_TOKEN }}
```