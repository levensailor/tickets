# Contributing

Thanks for contributing to Wilmington Tickets.

## Workflow

1. Create a new feature branch from `main`:

```bash
git checkout main
git pull
git checkout -b feature/your-short-description
```

2. Make your changes. Follow existing patterns for env vars (no hardcoded secrets or provider-specific names), server actions, and RLS-aware data access.

3. If your change requires a database update, add a new SQL script under `supabase/migrations/` (do not apply it automatically). Document it in the PR.

4. Update `CHANGELOG.md` with a timestamped entry when the change is a **feature** (not a bug fix).

5. Push your branch and open a pull request against `main`:

```bash
git push -u origin HEAD
```

6. In the PR description, explain:
   - What problem this solves
   - Why this change should be added to the repository
   - How you verified it (or what the reviewer should check)
   - Any new env vars or manual SQL the deployer must run

## Code standards

- Prefer TypeScript, Zod validation at boundaries, and Server Actions for mutations.
- Log meaningful server events with the shared logger (`src/lib/logger.ts`).
- Keep auth/payment header and payload formats aligned with Supabase and Stripe docs — do not invent fields.
- Do not commit `.env` files, virtual environments, or build artifacts.
