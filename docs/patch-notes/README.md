# Patch Notes Workflow (Weekly Releases)

This repo maintains two changelog streams:

- `CHANGELOG.txt`: developer/internal implementation log (code- and file-path-centric).
- `docs/patch-notes/`: player-facing patch notes (LoL-style).

## Files

- `docs/patch-notes/UNRELEASED.md`
  - Rolling, in-progress player-facing notes for the current week.
  - Updated daily as changes land.

- `docs/patch-notes/0.x.y.md`
  - Weekly release notes (immutable once shipped).
  - Cut every Sunday from `UNRELEASED.md`.

- `docs/heroes/*.txt`
  - Hero kit documentation.
  - Each hero keeps a `Unreleased` section for WIP changes, promoted into the weekly patch entry on Sunday.

## Cadence (Ship Every Sunday)

Assume current patch is `0.1.1`. Next Sunday patch is `0.1.2`.

### Monday–Saturday (Daily/WIP)
For each day you make changes:

1. **Update player-facing notes:**
   - Append to `docs/patch-notes/UNRELEASED.md` under today’s date header.
   - Keep entries short and measurable (Buff/Nerf/Adjust/Fix).

2. **If a hero changed:**
   - Add bullets under that hero’s `* **Unreleased**` section in `docs/heroes/<hero>.txt`.

**Example daily entry in UNRELEASED.md:**
```markdown
## 2026-02-03

### Heroes
- **Bran (Adjust):** Fortify DEF bonus 30% -> 25% at Level 1.

### Systems
- **Shop (Fix):** Buy button disables correctly when stock is 0.
```

### Sunday (Weekly Release)
On Sunday:

1. **Create `docs/patch-notes/0.1.2.md`**
   - Copy relevant items from `UNRELEASED.md`.
   - Rewrite/condense into clean release notes (merge duplicates, remove WIP noise).
   - Use the standard header format:
     ```markdown
     # Patch 0.1.2 Notes
     **Date:** 2026-02-08

     ## Highlights
     ...
     ```

2. **Reset `docs/patch-notes/UNRELEASED.md`**
   - Replace with a fresh template for the next week.

3. **Promote hero changes**
   - For each hero with Unreleased bullets:
     - Move those bullets into a new `* **0.1.2**` entry in `docs/heroes/<hero>.txt`.
     - Reset `* **Unreleased**` back to a placeholder line.

4. **Version bump**
   - Bump `package.json` version to `0.1.2`.

5. **Commit**
   - Commit release docs + version bump together.
