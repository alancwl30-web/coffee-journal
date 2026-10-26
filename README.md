# Coffee Channel · Coffee Journal

Latest source export — 26 October 2026. Includes Firebase Google sign-in and cloud sync, recipe dose scaling, brew comparisons, water mixing and Hario Switch templates.

This is a static HTML/CSS/JavaScript project. No npm installation or build is required. Actual app source is in `dist/`; the root `index.html` opens it using a relative path that also works on GitHub Pages.

## Upload manually to GitHub

1. Download and unzip this archive.
2. Sign in to your chosen GitHub account and create a repository, e.g. `coffee-channel`.
3. Select **Upload files** (or **uploading an existing file** in an empty repository).
4. Upload the extracted **contents**, including the entire `dist/` folder. Preserve its folder structure. Do not upload just the ZIP or nest everything inside an extra parent folder.
5. Commit the uploaded files.

At the repository root you should see `index.html`, `README.md`, `dist/`, `firestore.rules`, and the test files. The optional `.gitignore` may be hidden by your file manager.

## Publish with GitHub Pages (optional)

Uploading code does not automatically publish a website. In a repository that supports Pages, open **Settings → Pages**, select **Deploy from a branch**, choose your source branch (usually `main`) and **/ (root)**, then save. Use the URL GitHub provides after deployment completes.

No GitHub Actions workflow or GitHub token is included or required for branch-based Pages publishing. Publishing the static website makes the website interface public; coffee records remain protected by Firebase sign-in and Firestore rules. The original ChatGPT-hosted website is unchanged by this export.

## Firebase connection

- Existing project: `coffee-journal-342ba`.
- Database: Cloud Firestore `(default)`, Hong Kong (`asia-east2`).
- Sign-in: Google, through Firebase Authentication.
- Personal record path: `users/{uid}/brews/{brewId}`.
- Matching database rules are included in `firestore.rules`; they were already published to the existing project. Uploading this file to GitHub does not deploy rules.
- The public Firebase web configuration is in `dist/firebase-sdk.mjs`. It identifies the existing project, so this copy continues to use the same database. It contains no administrator private key, password, service-account credential or Git access token.
- **Before Google login can work on a new hosting URL**, open Firebase Console → Authentication → Settings → Authorized domains and add the exact new hostname. For GitHub Pages, add your account's `<username>.github.io` hostname, without `https://` or the repository path. Do not use the placeholder literally; take the hostname from your published URL.
- No Analytics is enabled. The app loads Firebase SDK version 12.19.0 from Google's official CDN.

Firebase is already connected; you do not need to create a new project or database. If you deliberately want a separate database, replace the web configuration and deploy appropriate rules to that separate project.

## Storage and sync

Without Google login, records stay in the browser and are labelled local-only. After login, records sync to the signed-in Google account. Use the same Google account on other devices.

The app retains a separate durable pending queue for each account and shows local-only, pending, synced or error status. Old browser records are imported only when you click the explicit import button; matching existing cloud IDs are skipped. Original local records are preserved.

The fixed `__connection_check` diagnostic document tests a real write and server read; it is excluded from coffee records and statistics. This archive contains source code only, not your coffee records, Google login sessions or database contents.

The first website load needs a network connection. This is not an offline PWA. If the same coffee record is edited on two devices simultaneously, the last successful cloud write wins; different records are saved separately.

## Local preview

Serve this directory with a static server, e.g.:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/`. Use HTTP rather than opening an HTML file directly: cloud sync uses JavaScript modules. Firebase currently authorizes `localhost` for sign-in.

## Checks

With Node.js installed, run:

```sh
node test-cloud.mjs
node test-scale.cjs
node test-advice.cjs
node test-templates.cjs
```

The tests cover outbox recovery, account separation, concurrent-record merge, stale acknowledgement protection, exact recipe water totals, preserved reference timing, advice and templates. Live Google sign-in and Firestore write/server-read verification also passed on the original hosted website.

See `PROJECT_NOTES.md` for Traditional Chinese feature and storage notes.

Source commit: `30fb4c0d0f220a7666404bd35b00a0d18c1a4b75`.
