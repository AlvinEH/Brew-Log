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
2. **Configure Firebase:** Set up your Firebase project variables in `.env.local` (copy from `.env.example`)
3. **For AI Features:** Get a Gemini API key from [AI Studio](https://aistudio.google.com/app/apikey)
   - **Local development:** Set `GEMINI_API_KEY` in `.env.local`  
   - **Production/GitHub Pages:** Enter your API key in the app's Settings tab
4. Run the app:
   `npm run dev`

## AI Features

The coffee bean import and recipe recommender require a Gemini API key:

- **🔒 Secure:** API keys are never exposed in the deployed code
- **🏠 Local Development:** Use `.env.local` for convenience  
- **🌐 Production:** Users enter their own API key in Settings → Gemini API Key
- **🆓 Free:** Get your key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

## Deploy to GitHub Pages

This project is configured for automatic deployment to GitHub Pages.

### Automatic Deployment (Recommended)

1. **Enable GitHub Pages** in your repository settings:
   - Go to Settings → Pages
   - Source: "GitHub Actions"

2. **Push to main branch** - deployment happens automatically via GitHub Actions

3. **Configure AI features**: Users must enter their own Gemini API key in the app's Settings tab

Your app will be available at: `https://[your-username].github.io/Brew-Log/`

### Manual Deployment

You can also deploy manually using:

```bash
# Option 1: Use the deployment script
./deploy.sh

# Option 2: Use npm command
npm run deploy
```

<<<<<<< Updated upstream
**Note:** Make sure you have `gh-pages` installed and your repository is properly configured for GitHub Pages.
=======
**Note:** Make sure you have `gh-pages` installed and your repository is properly configured for GitHub Pages. Users will need to provide their own Gemini API key in the app's Settings tab.
>>>>>>> Stashed changes
