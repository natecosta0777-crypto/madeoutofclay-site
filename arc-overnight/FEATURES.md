# Arc Feature Build Queue — "bells & whistles" (2026-06-02)

Worker picks the FIRST `- [ ]` line, builds it, RENDER-GATES it, and AUTO-MERGES on green
(Nate 15:06: "blast these out"). The render gate (build + tests + headless render-smoke
returning rendered:true, errors:[]) is the safety net; auto-revert if a merge breaks main.
Frontend-only; use mock/local data where a backend doesn't exist yet.
Follow brand rules in docs/arc-context.md + docs/handoff/project-brief.md. One PR per run.

## Queue
- [x] feat(arc-225): ARC 2-2-5 live pot ticker component + "so close" near-miss animation (Tier-2 accents only; mock pot value) (PR #83 needs review)
- [x] (PR #84 merged) feat(pos): POINT-OF-SALE v1 — add a NEW isolated /pos route (do NOT modify the main app render path / Index.tsx). Staff-terminal layout: catalog (membership tiers Junior $129, Golf $149, VIG $299, VIG Elite $499; sim-bay time blocks; coaching; retail — all MOCK), add-to-cart, cart summary with total, and a "Charge (demo)" button that SIMULATES a successful payment (NO real Stripe, NO payment keys, NO real charges, NO secrets) → branded receipt/confirmation screen. Brand-correct (Tier-3 flat brass for the terminal chrome; Tier-1 only on the success confirm). RENDER-GATE BOTH "/" AND "/pos" (run render-smoke.cjs against http://localhost:47123/pos too). Auto-merge on green like the rest (it's a demo stub, no real payments).
- [x] (PR #85 merged) feat(profile): trophy case / badges grid on Profile with rarity tiers (mock earned set)
- [x] (PR #86 merged) Streak freeze save-token UI with local logic supporting one freeze per month, wired to the streak engine
- [x] (PR #89 merged) feat(compete): clubhouse leaderboards — per-facility (Falmouth) + global tabs (mock standings). NOTE: previous attempt blocked because the route was not registered → 404. You MUST register the route in src/App.tsx (add it ABOVE the catch-all "*" route) AND render-gate that exact route (node render-smoke.cjs http://localhost:47123/<the-route>) so it actually loads with errors:[].
- [x] (PR #87 merged) feat(profile): AGR trajectory dashboard — handicap trend chart + "what's holding you back" insight card (mock series, recharts already in deps)
- [x] (PR #90 merged) feat(train): shot-dispersion heatmap viz on a session-results surface (mock shot data)
- [ ] feat(compete): challenge-a-friend share link card (generates a deep link; reuses referral pattern)
- [ ] feat(goals): goal-setting wizard ("break 80") with milestone tracker (local persistence)
- [ ] feat(compete): skins/Nassau auto-scoring UI for a sim round (pure scoring logic + result card)
- [ ] feat(compete): weekly tournament bracket view (mock bracket)
- [ ] feat(facility): QR bay check-in screen — generate/scan a bay code, deep-link that loads profile + last session (mock)
- [ ] feat(arc): seasonal "Pillars" progression / battle-pass track UI (mock tiers + cosmetics)
- [ ] feat(facility): bring-a-guest flow UI (guest day-pass request form, mock)
- [ ] feat(facility): bay "cast mode" big-screen celebration view (route that shows a user's Tier-1 moment full-screen)
- [ ] feat(notify): rivalry nudge component — "your rival just passed you" surfaced via existing silver-notifications
- [ ] feat(train): daily training plan card auto-generated from weakness-engine output (surface existing engine in UI)
- [ ] feat(reels): auto-highlight reel SCAFFOLD — session highlights screen w/ stitched clip placeholders + share (UI shell; real video pipeline later)

## Needs Nate (NOT buildable now — keys / hardware / backend)
- #1 AI swing overlay (pose model), #2 Voice Coach (speech key), #11 live multiplayer (Stream realtime),
  #17 bay booking (POS backend), #18 launch-monitor sync (TrackMan/Foresight API), #22 wearables (Whoop/Apple OAuth),
  #25 Apple Wallet + NFC (PassKit certs + native).
