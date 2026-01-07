# GitHub Pages Deployment Strategy

This repository uses GitHub Pages for hosting both the main application and PR previews.

## Deployment Structure

- **Main Deployment**: `https://luisgepeto.github.io/SuperSuper/`
  - Triggered on: Push to `main` branch
  - Workflow: `.github/workflows/deploy-gh-pages.yml`
  - Deployed to: Root of GitHub Pages (`/SuperSuper/`)

- **PR Previews**: `https://luisgepeto.github.io/SuperSuper/pr-{number}/`
  - Triggered on: PR opened, synchronized, or reopened
  - Workflow: `.github/workflows/deploy-pr-preview.yml`
  - Deployed to: PR-specific subdirectory (`/SuperSuper/pr-{number}/`)
  - Automatically cleaned up when PR is closed

## How It Works

### Main Deployment

1. When code is pushed to the `main` branch, the `deploy-gh-pages.yml` workflow runs
2. The application is built with base path `/SuperSuper/`
3. The build artifacts are deployed to the root of the `gh-pages` branch
4. GitHub Pages serves the content at `https://luisgepeto.github.io/SuperSuper/`

### PR Preview Deployment

1. When a PR is opened or updated, the `deploy-pr-preview.yml` workflow runs
2. The application is built with base path `/SuperSuper/pr-{number}/`
3. The build artifacts are deployed to a PR-specific subdirectory in the `gh-pages` branch
4. A comment is posted on the PR with the preview URL
5. Each time the PR is updated, the preview is rebuilt and redeployed
6. When the PR is closed, the `cleanup-pr-preview.yml` workflow removes the preview

### Benefits

- **No Conflicts**: PR previews are deployed to separate subdirectories, ensuring they never override the main deployment
- **Easy Testing**: Each PR gets its own preview URL for validation
- **Automatic Cleanup**: Preview deployments are automatically removed when PRs are closed
- **Multiple PRs**: Multiple PRs can have active previews simultaneously without interfering with each other

## Manual Cleanup

If you need to manually clean up old PR preview directories:

1. Checkout the `gh-pages` branch
2. Remove the `pr-{number}` directory
3. Commit and push the changes

```bash
git checkout gh-pages
rm -rf pr-{number}
git add .
git commit -m "Clean up PR #{number} preview"
git push
```

## Permissions

The workflows require the following permissions:
- `contents: write` - To push to the `gh-pages` branch
- `pull-requests: write` - To comment on PRs
- `pages: write` - To deploy to GitHub Pages
- `id-token: write` - For GitHub Pages deployment authentication
