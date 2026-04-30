# GitHub Pages Dual Deployment Setup Instructions

## Overview
Your repository is now configured to deploy:
- **Main branch** (legacy vanilla JS app) → `https://USERNAME.github.io/zh-bible-verse-memorizer/`
- **Refactor branch** (SvelteKit app) → `https://USERNAME.github.io/zh-bible-verse-memorizer/preview/Refactor/`

Both apps will coexist on the `gh-pages` branch without conflicts.

## What Was Changed (Already Done on Refactor Branch)

### 1. Updated `svelte.config.js`
- Removed hardcoded base path
- Now reads from `BASE_PATH` environment variable
- Development mode uses empty base path (for local testing)

### 2. Created `.github/workflows/refactor-preview.yml`
- Triggers on pushes to `Refactor` branch
- Builds SvelteKit app with base path `/zh-bible-verse-memorizer/preview/Refactor`
- Deploys to `preview/Refactor/` folder on `gh-pages` branch
- Uses `clean: false` to preserve other content on gh-pages
- Cleans only the `preview/` folder to avoid conflicts

### 3. Created `.github/workflows/main-deploy.yml` (Template)
- Ready to deploy on `main` branch
- Deploys contents of `legacy/` folder to root of `gh-pages`
- Preserves `preview/` folder when deploying

## Steps You Need to Complete

### Step 1: Commit and Push Refactor Branch Changes
```bash
# You're currently on the Refactor branch
git add .
git commit -m "Configure Refactor branch for preview deployment"
git push origin Refactor
```

### Step 2: Switch to Main Branch and Update Workflow
```bash
# Switch to main branch
git checkout main

# Delete the old deploy.yml workflow
git rm .github/workflows/deploy.yml

# Rename the new workflow (if you created it on Refactor, cherry-pick or recreate)
# Or create main-deploy.yml on main branch with this content:
```

Create `.github/workflows/main-deploy.yml` on the main branch with:
```yaml
name: Deploy Legacy App to GitHub Pages

on:
  push:
    branches:
      - main

permissions:
  contents: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    concurrency: ci-\${{ github.ref }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Prepare legacy app for deployment
        run: |
          mkdir -p deploy
          cp -r legacy/* deploy/
          touch deploy/.nojekyll

      - name: Deploy to gh-pages root
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: deploy
          branch: gh-pages
          clean: false
          clean-exclude: |
            preview/**
```

Then commit and push:
```bash
git add .github/workflows/
git commit -m "Update main branch to deploy legacy app"
git push origin main
```

### Step 3: Configure GitHub Pages Settings
1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under "Build and deployment":
   - **Source**: Select "Deploy from a branch"
   - **Branch**: Select `gh-pages` and `/ (root)`
4. Click **Save**

### Step 4: Trigger Initial Deployments
Both workflows will run automatically, but you can trigger them manually:

1. **Main branch deployment**:
   - Push a commit to `main` branch (workflow will run)
   - Or go to Actions tab → "Deploy Legacy App to GitHub Pages" → "Run workflow"

2. **Refactor branch deployment**:
   - Push a commit to `Refactor` branch (workflow will run)
   - Or go to Actions tab → "Deploy Refactor Preview" → "Run workflow"

### Step 5: Verify Deployments
After both workflows complete successfully:

- **Production app**: `https://USERNAME.github.io/zh-bible-verse-memorizer/`
  - Should show your legacy vanilla JS PWA
  
- **Preview app**: `https://USERNAME.github.io/zh-bible-verse-memorizer/preview/Refactor/`
  - Should show your new SvelteKit app

## Testing Locally

### Refactor Branch (SvelteKit)
```bash
# Development (no base path)
npm run dev

# Production preview with base path
BASE_PATH=/zh-bible-verse-memorizer/preview/Refactor npm run build
npm run preview
# Visit: http://localhost:4173/zh-bible-verse-memorizer/preview/Refactor/
```

### Main Branch (Legacy App)
```bash
# Just open legacy/index.html in a browser
# Or use a simple HTTP server:
cd legacy
python3 -m http.server 8000
# Visit: http://localhost:8000
```

## Important Notes

### Service Worker Scope
- **Legacy app**: Service worker at `/zh-bible-verse-memorizer/sw.js` serves root
- **Refactor app**: Service worker at `/zh-bible-verse-memorizer/preview/Refactor/sw.js` serves preview
- These won't conflict because they have different scopes

### .nojekyll File
Both workflows create `.nojekyll` files to prevent GitHub Pages from processing files with Jekyll, which can interfere with certain filenames (like those starting with underscores).

### Clean Strategy
- Each workflow uses `clean: false` to preserve other content
- Main workflow excludes `preview/**` from cleaning
- Refactor workflow only cleans within `preview/` folder
- This prevents the workflows from deleting each other's deployments

### Future Branches
If you create more preview branches, you can:
1. Copy `refactor-preview.yml`
2. Change the branch name and target folder
3. Deploy to `/zh-bible-verse-memorizer/preview/BRANCH_NAME/`

## Troubleshooting

### Workflow Fails with "Permission Denied"
- Check that the workflow file has `permissions: contents: write`
- Ensure GitHub Pages is enabled in repository settings

### Apps Show 404 Errors
- Verify GitHub Pages is set to deploy from `gh-pages` branch
- Check the Actions tab to ensure workflows completed successfully
- Wait a few minutes after deployment for changes to propagate

### Preview App Assets Fail to Load
- Ensure `BASE_PATH` environment variable is set correctly in workflow
- Check browser console for 404s - paths should include `/preview/Refactor/`

### Both Apps Deploy to Wrong Locations
- Verify the `target-folder` settings in each workflow
- Check the `clean-exclude` patterns match your folder structure

## Workflow File Locations

- **Refactor branch**: `.github/workflows/refactor-preview.yml` (active)
- **Main branch**: `.github/workflows/main-deploy.yml` (needs to be created)
- **Old workflow**: `.github/workflows/deploy.yml` (should be deleted from main)

Replace `USERNAME` with your GitHub username in all URLs above.
