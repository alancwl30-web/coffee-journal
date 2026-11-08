# Coffee Journal — 2026-11-09

English / Traditional Chinese coffee journal with Firebase private account sync.

This complete update adds editing a copy of every built-in/reference recipe, simplifies the editor, removes repeated hints, and adds confirmed brew deletion with automatic linked-bean inventory recalculation. Saved copies preserve source links.

## Update GitHub Pages

Unzip and upload ALL contents, including the complete dist/ folder and root index.html, to your existing main branch. Commit changes. Do not upload the ZIP or enclosing folder. Keep Pages set to main / (root). No build step or Firebase rule change is needed. Update every device/client to avoid mixing older frontends with deletion markers.

Google sign-in keeps each user's records private. Offline deletion waits in the same durable sync queue; there is no restore screen. Historical optional water/ice metadata remains stored even though those editor controls are hidden.

Includes all previous features: recipe scaling, guided brewing, multi-temperature water mixing, bean inventory, personal recipes and language switching. See PROJECT_NOTES.md for details.
