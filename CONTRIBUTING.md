# Contributing

Thanks for your interest in improving this documentation template.

## Where to start

- **Just forked the template into a new project?** → [`docs/onboarding/01-first-fork.md`](docs/onboarding/01-first-fork.md). This is not a contribution guide; it's an adoption checklist.
- **Contributing to the template itself (fixing a rule, adding a chapter)?** → keep reading.

## The short version

1. **Read** [`docs/_meta/usage-guide.md`](docs/_meta/usage-guide.md) — task-to-chapter router. Find where your proposed change fits.
2. **Open an issue first** for anything non-trivial (new category, new rule, rule change). Use the template at [`.github/ISSUE_TEMPLATE/feature_request.md`](.github/ISSUE_TEMPLATE/feature_request.md). This avoids building the wrong thing.
3. **Branch** by convention in [`docs/workflow/01-git.md`](docs/workflow/01-git.md) раздел 1: `feature/<desc>`, `fix/<desc>`, `docs/<desc>`, `chore/<desc>`.
4. **Commit** by convention in [`docs/workflow/01-git.md`](docs/workflow/01-git.md) раздел 2: `<type>(<scope>): <subject>`, ≤ 50 chars, imperative, no trailing period.
5. **Run the linter** before committing: `npm run lint`. The same check runs in CI; local linting saves a round-trip.
6. **Open a PR** using [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md). The template maps directly to [`docs/workflow/02-pull-requests.md`](docs/workflow/02-pull-requests.md) раздел 3.
7. **Expect code review** per [`docs/workflow/03-code-review.md`](docs/workflow/03-code-review.md). Feedback uses explicit prefixes: `[blocker]`, `[issue]`, `[suggestion]`, `[nit]`, `[question]`, `[praise]`.

## What kind of change needs an ADR

Per [`docs/_meta/governance.md`](docs/_meta/governance.md) раздел 4, structural changes **MUST** go through an ADR before implementation:

- Introducing a new category under `docs/`.
- Changing the frontmatter schema.
- Renaming or removing a layer / segment / section convention.
- Flipping a rule's RFC 2119 strength (e.g., `SHOULD` → `MUST` or vice versa).
- Introducing or deprecating a `variants/*` chapter.

Non-structural edits (formulation, examples, typos, cross-links) — a plain PR with a `version` bump is sufficient. See [`docs/_meta/frontmatter.md`](docs/_meta/frontmatter.md) раздел 2 for semver of chapters.

The ADR template lives at [`docs/_meta/templates/ADR.md`](docs/_meta/templates/ADR.md). Existing ADRs (0001–0010) at [`docs/decisions/`](docs/decisions/) serve as precedent.

## Style

- Language: Russian for chapter content; English for code, identifiers, commit messages, this file, and the root `AGENTS.md`. Full policy: [ADR 0006](docs/decisions/0006-language-policy.md).
- Rule keywords: RFC 2119 (`MUST`, `SHOULD`, `MAY`, `MUST NOT`, `SHOULD NOT`), always uppercase and bold. Non-keyword hedging (`желательно`, `стоит`, `лучше`) is forbidden in rule positions. Full rules: [`docs/_meta/style-guide.md`](docs/_meta/style-guide.md).
- No `§` — use the Russian word `раздел` for section references.

## Red flags that block merge

The linter catches most mechanics. Humans still check:

- Changed rule without bumping `version` in the file's frontmatter.
- Stale `last-reviewed` after content change.
- Hard Invariant in a category `AGENTS.md` no longer reflecting the chapter content it summarizes.
- New rule without at least one `✓ Correct` / `✗ Wrong` example.
- Anti-patterns section missing from a new chapter (see chapter templates at [`docs/_meta/templates/`](docs/_meta/templates/)).

## Where to ask

- **Discoverability / what's the rule for X?** → [`docs/_meta/usage-guide.md`](docs/_meta/usage-guide.md).
- **Why does rule X exist?** → [`docs/decisions/`](docs/decisions/) — ADRs document every structural "why".
- **Governance / ownership / cadence?** → [`docs/_meta/governance.md`](docs/_meta/governance.md).
- **Questions about the linter?** → [`docs/_meta/ci-linter.md`](docs/_meta/ci-linter.md).

## Security issues

See [`SECURITY.md`](SECURITY.md).
