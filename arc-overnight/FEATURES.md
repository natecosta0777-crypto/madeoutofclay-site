# Arc Feature Build Queue — "bells & whistles" (2026-06-02)

Worker picks the FIRST `- [ ]` line, builds it, RENDER-GATES it, opens a PR, and STOPS.
ALL features here are REVIEW ONLY — open the PR, DO NOT merge (Nate reviews UI on the
investor app). Frontend-only; use mock/local data where a backend doesn't exist yet.
Follow brand rules in docs/arc-context.md + docs/handoff/project-brief.md. One PR per run.

## Queue
- [x] feat(arc-225): ARC 2-2-5 live pot ticker component + "so close" near-miss animation (Tier-2 accents only; mock pot value) (PR #83 needs review)
- [ ] feat(profile): trophy case / badges grid on Profile with rarity tiers (mock earned set)
- [ ] feat(streaks): "streak freeze" save-token UI + local logic (one freeze/month) wired to streak-engine
- [ ] feat(compete): clubhouse leaderboards — per-facility (Falmouth) + global tabs (mock standings)
- [ ] feat(profile): AGR trajectory dashboard — handicap trend chart + "what's holding you back" insight card (mock series, recharts already in deps)
- [ ] feat(train): shot-dispersion heatmap viz on a session-results surface (mock shot data)
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
