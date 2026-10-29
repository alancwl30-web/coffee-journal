# Coffee Journal — English / Traditional Chinese — 2026-10-29

This full package includes every previous feature and the new Language / 語言 switcher. Traditional Chinese is the default; choose English from the page or dialog header. Your choice is remembered on this browser. Switching preserves open form values and the timer. Personal names and notes remain in their original language. No Firebase changes or data migration.

## Update GitHub Pages
Unzip and upload ALL contents, including the complete dist/ folder, to your existing main branch, then Commit changes. Do not upload the zip itself. Keep Pages set to main / (root). Root index.html redirects to ./dist/. Refresh after deployment. All files are required, including dist/i18n.js, dist/i18n.css and dist/i18n-en.json. No npm/build step is needed.

Includes guided brewing, bean batches and inventory, personal recipes, target-versus-actual data, defaults/quick rebrew, dose scaling, multi-temperature water mixing with kettle correction, and per-account cloud sync. Timer drafts are device-local; lock-screen audio is not guaranteed. See PROJECT_NOTES.md for details.

Checks: node test-i18n.cjs; node test-experience.cjs; node test-cloud.mjs; node test-water-mix.cjs; node test-scale.cjs; node test-advice.cjs; node test-templates.cjs.
