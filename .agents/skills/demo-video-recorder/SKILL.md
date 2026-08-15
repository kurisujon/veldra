---
name: demo-video-recorder
description: >
  Generates a captioned demo video of one Veldra UI flow at a time, by
  reading the actual page/component code for that flow, driving a real
  Chromium browser through it with Playwright, and recording the session
  with burned-in text captions. Activate when asked to "record a demo",
  "make a walkthrough video", "generate a demo video", or similar, for a
  named flow (e.g. "demo the case review flow"). Never covers more than one
  flow per run — ask which flow if it isn't stated.
---

# Demo Video Recorder (Veldra)

## Purpose

Turn a real, working Veldra flow into a short screen-recorded video with
text captions, by actually reading the flow's code and driving the real
app through Playwright — not by describing the UI from memory or
hallucinating steps that don't exist in the codebase.

One flow per run. If the request is vague ("make a demo video"), ask which
flow before doing anything else — don't guess.

## Step 1 — Identify the flow

Confirm the target flow in plain terms (e.g. "case review," "document
upload," "findings resolution"). Cross-check it against `docs/CASE_WORKFLOW.md`
and `docs/FEATURE_REQUIREMENTS.md` so the flow you record matches how the
project itself defines it, not an assumption.

## Step 2 — Read the real code before writing anything

Before touching Playwright, locate and read the actual files for this flow:

- The route/page component(s) under the feature-based folder structure
  described in `docs/FOLDER_STRUCTURE.md`
- The components it renders, per `docs/COMPONENT_RULES.md`
- Any server actions or RPCs it calls

From this, extract:

- The real URL path(s) for the flow
- The real sequence of user actions (click, type, select, upload) needed
  to complete it
- Stable selectors already in the markup — prefer `data-testid`, `aria-label`,
  or visible text over CSS classes, since Tailwind classes here are
  intentionally not stable identifiers (`docs/DEVELOPMENT_RULES.md`)
- If no `data-testid` exists on an element you need to target, add one to
  the component as part of this task rather than relying on a fragile
  selector — treat that as a small, in-scope change, and mention it in
  your final report.

Do not invent UI copy, button labels, or steps that aren't in the actual
code. If the flow doesn't work the way you expected, that's a discovered
issue to report, not something to paper over in the video.

## Step 3 — Build the shot list

Turn the real flow into an ordered list of steps, each with:

- The Playwright action (`goto`, `click`, `fill`, `waitFor...`)
- A short caption describing what's happening, written in your own words
  from what the code and `docs/CASE_WORKFLOW.md` actually describe — not
  marketing copy
- A dwell time (how long that step stays on screen — 2.5–4s is usually
  enough to read a short caption)

Keep captions short — one line, plain language, present tense
("Uploading the supporting document...", "Findings flagged automatically").

## Step 4 — Data safety (non-negotiable)

Veldra handles case/document data that is likely sensitive (government LGU
records, applicant documents, findings). Never record real production or
live user data.

- Use a seeded demo account and seeded/mock case data only. If a seed
  script doesn't already exist for this, check `docs/DEVELOPMENT_RULES.md`
  / the repo for one before improvising — don't invent throwaway data that
  bypasses the schema or RLS assumptions.
- If the only available data is real case data, stop and flag this instead
  of recording it. This is a hard stop, not a judgment call to make alone.

## Step 5 — Environment setup

- Confirm the dev server is running (check `package.json` scripts, e.g.
  `next dev`); start it if it isn't, and note that you started it so it
  can be stopped afterward.
- Confirm the port the flow needs and that nothing else is already bound
  to it.
- Confirm Playwright is installed (`playwright` in `package.json` /
  `node_modules`); if not, install it as a dev dependency and run
  `npx playwright install chromium` before proceeding, and mention this
  as a new dependency in your final report.

## Step 6 — Write the recording script

Use Playwright's built-in video recording rather than a separate screen
recorder — it's deterministic and doesn't capture anything outside the
browser viewport. Save the script under something like
`scripts/demos/record-<flow-name>.ts` so it's reusable, not a one-off.

Skeleton to adapt with the real steps and selectors from Step 2/3:

```ts
import { chromium } from 'playwright';

async function recordDemo() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: 'demos/videos/',
      size: { width: 1920, height: 1080 },
    },
  });
  const page = await context.newPage();

  const showCaption = async (text: string, ms: number) => {
    await page.evaluate((caption) => {
      const el = document.createElement('div');
      el.id = '__demo-caption';
      el.textContent = caption;
      Object.assign(el.style, {
        position: 'fixed',
        bottom: '48px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.75)',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '8px',
        fontSize: '18px',
        fontFamily: 'sans-serif',
        zIndex: '999999',
      });
      document.body.appendChild(el);
    }, text);
    await page.waitForTimeout(ms);
    await page.evaluate(() => document.getElementById('__demo-caption')?.remove());
  };

  // Example step — replace with the real flow from Step 2/3
  await page.goto('http://localhost:3000/<real-route>');
  await showCaption('Opening the case review dashboard...', 3000);

  await page.click('[data-testid="<real-selector>"]');
  await showCaption('Selecting a case to review...', 3000);

  // ...remaining steps from the shot list...

  await context.close();
  await browser.close();
}

recordDemo();
```

Notes on the overlay:
- The caption styling above is a plain generic default — pull the actual
  font, color, and radius tokens from `docs/DESIGN_SYSTEM.md` if you want
  it to look native to the product rather than a generic overlay.
- Remove `#__demo-caption` before the next step's screenshot moment so
  captions don't stack on top of each other.

## Step 7 — Run it and verify

Run the script (`npx tsx scripts/demos/record-<flow-name>.ts` or
equivalent). Playwright writes a `.webm` file into `demos/videos/` when
`context.close()` runs. Confirm:

- The file exists and has a non-trivial size (a 0–few KB file usually
  means the recording failed silently)
- Roughly the expected duration (sum of your dwell times, plus action time)

If it fails, report the actual error — don't report success because the
script "should" have worked.

## Step 8 — Output format

Playwright outputs `.webm`. If `ffmpeg` is available, convert to `.mp4`
for wider compatibility:

```
ffmpeg -i demos/videos/<generated-name>.webm -c:v libx264 -crf 20 demos/<flow-name>.mp4
```

If `ffmpeg` isn't available, leave it as `.webm` and say so — don't claim
an `.mp4` was produced if it wasn't.

## Step 9 — Clean up

- Stop the dev server if you started it in Step 5.
- Leave the recording script in `scripts/demos/` (reusable), but don't
  leave stray temp files, seed-data mutations, or half-finished `.webm`
  files from failed attempts.

## Step 10 — Report back

Close with:

- Which flow was recorded, and the file path of the final video
- The real route(s) and selectors used (so it's clear this reflects
  actual code, not assumptions)
- Whether real code changes were needed to make it recordable (e.g. added
  `data-testid` attributes) — call these out explicitly, they're a
  discovered/in-scope change, not just video tooling
- What data source was used (seed account/dataset — never real case data)
- Anything that didn't work as expected in the actual flow, separate from
  the video itself

## Important principles

- One flow per run. If asked for a "full tour," break it into separate
  recordings rather than one long unfocused video.
- Ground every caption and every step in code you actually read, not in
  what the feature is "supposed" to do.
- Never record real case/applicant data — seeded/mock data only, and stop
  rather than improvise if none exists.
- Prefer stable selectors (`data-testid`, roles) over CSS classes; add
  them to components when missing rather than writing a fragile script.
- Report failures as failures — a `.webm` that's empty or a script that
  errored out is not "done."
