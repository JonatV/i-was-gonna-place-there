# IWGPT — workflow

Chrome extension for colonist.io. Nothing deploys automatically: Chrome loads the folder you point it to.

```
manifest.json       → extension entry point (what Chrome loads)
src/                → code
test/               → tests + anonymised fixtures
docs/               → roadmap, protocol notes, this file
captures/           → raw game captures (git-ignored, never committed)
```

Until chapter 9 there is no build step: Chrome loads the repo folder itself. From chapter 9 on, `npm run build` produces `dist/`, and Chrome loads `dist/`.

| Branch | Role | Used for |
|---|---|---|
| `main` | stable — one merge per finished chapter | tagged versions, GitHub releases |
| `dev` | work in progress | the version loaded in Chrome while coding |

Versions follow the roadmap: `v0.N.0` = chapter N done (all "C'est bon quand" boxes ticked). `v1.0.0` = first public release.

## Work (on `dev`)

```bash
git checkout dev
# chrome://extensions → ↻ on IWGPT, then reload colonist.io
npm test                               # from chapter 3 on
git commit -am "feat: hook websocket constructor"
git push                               # saved, main untouched
```

## Finish a chapter (release)

```bash
# on dev: set "version" in manifest.json to 0.N.0
git commit -am "chore: bump version to 0.N.0"
git checkout main
git merge dev
npm test
git push
git tag v0.N.0 && git push --tags
git checkout dev
```

Optional, once there is a build: zip `dist/` and attach it to a GitHub release.

```bash
npm run build
(cd dist && zip -r ../iwgpt-v0.N.0.zip .)
gh release create v0.N.0 iwgpt-v0.N.0.zip --notes "Chapter N: …"
```

## Commit messages

`type: message` — lowercase, imperative, short.

| Type | For |
|---|---|
| `feat` | new capability (hook, decoder, analysis, panel feature) |
| `fix` | bug fix |
| `test` | new or updated tests, anonymised fixtures |
| `style` | panel design tweak (colors, spacing, fonts) |
| `perf` | decoding / rendering performance |
| `refactor` | code cleanup, same result |
| `docs` | README, protocol notes, comments |
| `chore` | config, tooling (`manifest.json` version, `.gitignore`, build) |
| `revert` | undo a previous change |

Examples: `feat: decode fixmap and fixarray` · `docs: document dice roll message` · `test: add anonymised 4-player capture`.

## Before committing a fixture

Raw captures live in `captures/` (git-ignored). A file only goes into `test/fixtures/` once it is anonymised: other players' names replaced, chat removed, no session id or token.

## Run a previous version

```bash
git tag                                # list versions
git worktree add ../iwgpt-v0.2.0 v0.2.0
# chrome://extensions → Load unpacked → ../iwgpt-v0.2.0
git worktree remove ../iwgpt-v0.2.0    # when done
```

## Roll back

Undo one commit (history kept):

```bash
git checkout main
git revert <commit>
git push
```

Bring one file back to an older version:

```bash
git checkout v0.2.0 -- src/codec/msgpack.js
git commit -m "revert: msgpack decoder back to v0.2.0" && git push
```