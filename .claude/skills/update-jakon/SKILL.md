---
name: update-jakon
description: Build jakon-filemanager with the "jakon" configuration and copy the fixed-name dist files (main.js, styles.css, favicon.ico, i18n/*.json) into the Jakon repository's static assets.
disable-model-invocation: true
---

# Update the file manager in Jakon

Puts a new build of jakon-filemanager into Jakon. Jakon serves it as a second, "beta" file manager
(`FileManagerV2Controller`, path `/admin/filemanager2`) next to the original AngularJS one, so both can be used
side by side while this rewrite is being tested. Jakon has the built files checked in; the two Pebble
templates that embed them are `fileManagerV2.peb` (wrapper + sideMenu + iframe) and `fileManagerV2Frame.peb`
(the actual SPA host page). Do the steps in this order and stop at the first failure, nothing is copied
unless everything before it passed.

Jakon is the repository next to jakon-filemanager, `../Jakon` from the root of this project (the paths
differ between computers, so never write an absolute one; another directory can be given as an argument of
the skill). Use it as `$JAKON` below, the commands run in the root of this project:

```bash
JAKON=../Jakon
test -d "$JAKON/modules/core" || echo "Jakon not found at $JAKON"
```

When Jakon is not there, stop and ask the user where it is. Its files:

- `modules/core/src/main/resources/static/jakon/filemanager/main.js` ← `dist/jakon-filemanager-jakon/browser/main.js`
- `modules/core/src/main/resources/static/jakon/filemanager/styles.css` ← `dist/jakon-filemanager-jakon/browser/styles.css`
- `modules/core/src/main/resources/static/jakon/filemanager/favicon.ico` ← `dist/jakon-filemanager-jakon/browser/favicon.ico`
- `modules/core/src/main/resources/static/jakon/filemanager/i18n/*.json` ← `dist/jakon-filemanager-jakon/browser/i18n/*.json`
- `modules/core/src/main/resources/templates/admin/objects/fileManagerV2.peb`, `fileManagerV2Frame.peb` — the
  markup/bootstrap page, not touched by this skill (deploying a new build doesn't change them)
- `modules/core/src/main/scala/cz/kamenitxan/jakon/webui/controller/impl/FileManagerV2Controller.scala` — only
  renders the two templates above; the JSON/upload/download API is still served, unchanged, by the original
  `FileManagerController` at `/admin/files/*` (this app's API base is hardcoded to `/admin/files`, independent
  of which page loaded it)
- `modules/core/src/main/resources/templates/admin/common_cs_CZ.properties`,
  `common_en_US.properties` — the `FileManagerV2Controller=…` sidebar label key

## 1. Check the project

Run in the jakon-filemanager project and stop when something fails:

```bash
npm test
```

## 2. Build

```bash
npm run build:jakon
```

This uses the `jakon` Angular build configuration (`outputHashing: "none"`, `baseHref: "/jakon/filemanager/"`),
producing stable file names instead of the default production build's hashed ones. Output goes to
`dist/jakon-filemanager-jakon/browser/`: `main.js`, `styles.css`, `favicon.ico`, `i18n/cs.json`, `i18n/en.json`
have to exist and be fresh (check the time of the files, a failed build leaves the old ones).

## 3. Copy the build

Only after steps 1 and 2 passed:

```bash
dest="$JAKON/modules/core/src/main/resources/static/jakon/filemanager"
cp dist/jakon-filemanager-jakon/browser/main.js "$dest/main.js"
cp dist/jakon-filemanager-jakon/browser/styles.css "$dest/styles.css"
cp dist/jakon-filemanager-jakon/browser/favicon.ico "$dest/favicon.ico"
cp dist/jakon-filemanager-jakon/browser/i18n/*.json "$dest/i18n/"
```

## 4. Report

`modules/core/src/main/resources/static/jakon/` is gitignored in Jakon, so the four copied files never show up
in `git status` — just confirm they were copied (e.g. `ls -la "$dest"` with fresh timestamps). Show
`git -C "$JAKON" status --short` and `git -C "$JAKON" diff --stat` for everything else, in case something
else in Jakon is uncommitted. Do not commit in either repository unless the user asks, the Jakon repository
may have other uncommitted work. Remind the user that the Jakon side (Scala, templates) is not compiled or
rendered by this skill, so Jakon has to be rebuilt and restarted, and the `/admin/filemanager2` page looked at once.
