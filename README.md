# Coffee & Matcha Journal — 2026-11-22

Complete English / Traditional Chinese website update. Includes all previous coffee functionality and an isolated matcha journal with drinks, recipes, batch inventory, scaling, ratings, comparison, local drafts and export. Coffee data is not migrated or rewritten.

## GitHub update

Unzip and upload ALL contents, including the complete dist/ folder and root index.html, to your main branch. Commit changes. Keep Pages set to main / (root). Do not upload the ZIP or enclosing folder.

## Required Firebase addition

For matcha cloud sync, add the block in MATCHA_FIREBASE_RULES.txt INSIDE your existing match /databases/{database}/documents block, then Publish in Firebase Console. KEEP all existing coffee and Home Kitchen rules. Do not replace the full live rules file. Coffee needs no rule change. No login provider changes are needed.

Matcha uses users/{uid}/matcha, independently of coffee's users/{uid}/brews. Signed-in writes are queued locally until permissions/connection work; the screen reports pending or failed sync. Anonymous matcha entries stay on this device until explicitly imported into a signed-in account. Drafts remain device-local.

The production Firebase rule has not been published or tested by this update. See PROJECT_NOTES.md for tests and details.
