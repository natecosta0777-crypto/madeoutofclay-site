# Arc Overnight Build Queue (2026-06-01 → 2026-06-02)

Worker picks the FIRST `- [ ]` line and ships it. Authority FULL SEND (Nate, 21:08):
auto-merge EVERY task when build + all tests pass, including UI/styling/a11y/shadows.
Safety valves: edge-fn code may merge but NEVER deploy; large/ambiguous visual changes
get deferred not merged; auto-revert if a merge breaks main. Never deploy edge fns,
apply migrations, touch secrets, force-push, or edit Jackpot*. Full rules in cron prompt.

## Queue (priority order)
- [x] fix(silver): week keys parsed as local dates — TZ bug in weekly stats (PR #67)
- [x] ci: add .github/workflows/ci.yml running npm ci + vite build + vitest on PRs and pushes to main (typecheck step allowed to be non-blocking) (PR #68)
- [x] chore(lint): fix the ~10 @typescript-eslint/no-explicit-any errors in supabase/functions/*/index.ts by giving real types; get `npx eslint .` to 0 errors (PR #69)
- [x] feat(resilience): add a top-level React ErrorBoundary with a branded fallback wrapping the router so a component crash never white-screens the app (PR #70, merged)
- [x] (PR #72 needs review)
- [x] (PR #73 needs review)
- [x] perf(bundle): code-split heavy top-level surfaces with React.lazy + Suspense to shrink the 3.5MB main chunk; confirm in build output that main chunk shrinks (PR #71, merged)
- [x] (PR #? merged)
- [ ] feat(observability): add @sentry/react init gated on import.meta.env.VITE_SENTRY_DSN (no-op when unset; no secret committed); wire into the ErrorBoundary
- [ ] a11y: add aria-labels to icon-only buttons + dialog titles/focus traps across HomePage, primary nav, and the Coach FAB
- [ ] style(shadows): redefine --shadow-elevate in index.css to a warm brand-tinted shadow (augusta-green / aged-brass ~10%) per SF-1; FLAG for visual review in PR body
- [ ] test: add unit tests for src/lib/streak-engine.ts (pure logic, edge cases)
- [ ] test: add unit tests for src/lib/achievement-engine.ts
- [ ] test: add unit tests for src/lib/daily-mission.ts
- [ ] docs: refresh README.md (stack, setup, scripts, deploy notes, repo layout)
- [ ] security(edge, CODE ONLY — do NOT deploy): add caller/owner-auth + basic per-user rate limiting to analyze-swing & analyze-form; PR clearly marked not-deployed
- [ ] perf(render): memoize expensive lists/cards (React.memo + useMemo) in MatchesPage & LeaderboardPage; no behavior change
- [ ] chore(deps): audit + remove unused deps/exports; keep build + tests green
- [ ] feat(seo): add brand-correct <title>, meta description, Open Graph + Twitter card tags to index.html
- [ ] security(headers): add security headers in vercel.json (X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, X-Frame-Options SAMEORIGIN, Permissions-Policy) — do NOT add a strict CSP that could break YouTube/Stream embeds
- [ ] a11y: respect prefers-reduced-motion — gate non-essential CSS animations/transitions behind the media query
- [ ] test: add unit tests for src/lib/performance-engine.ts and src/lib/weakness-engine.ts
- [ ] test: add an App render smoke test (mount <App/> without crashing) to catch integration regressions
- [ ] feat(perf): add brand-neutral Suspense fallback skeletons for the lazy-loaded routes (minimal, conservative)
- [ ] perf(images): add loading="lazy" + explicit width/height to <img> tags to reduce layout shift
- [ ] chore(tsc): reduce baseline tsc errors where safe WITHOUT changing runtime or DB schema (optional typing/guards for speculative supabase columns); keep build green
- [ ] docs: add docs/architecture.md (high-level component + data-flow + state-context map)
- [ ] chore(repo): add .nvmrc + package.json engines (node version) + tidy npm scripts

## Do NOT auto-do (needs Nate)
- Jackpot → ARC 2-2-5 rename (P0 compliance, but touches DB/routes/analytics — too risky unattended)
- Merging PRs, deploying, applying migrations, editing secrets/.env
