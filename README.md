<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/68823568-fe8c-4a78-83c3-6c9f2f4fe225

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to GitHub Pages

This project is configured for automatic deployment to GitHub Pages.

### Automatic Deployment (Recommended)

1. **Enable GitHub Pages** in your repository settings:
   - Go to Settings → Pages
   - Source: "GitHub Actions"

2. **Add your API key as a secret**:
   - Go to Settings → Secrets and variables → Actions
   - Add a new repository secret: `GEMINI_API_KEY`

3. **Push to main branch** - deployment happens automatically via GitHub Actions

Your app will be available at: `https://[your-username].github.io/Brew-Log/`

### Manual Deployment

You can also deploy manually using:

```bash
# Option 1: Use the deployment script
./deploy.sh

# Option 2: Use npm command
npm run deploy
```

**Note:** Make sure you have `gh-pages` installed and your repository is properly configured for GitHub Pages.
