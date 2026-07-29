# Developer Guide

Requirements: Node 22, PostgreSQL 16 and npm.

1. Copy environment values into `.env.local`; never commit the file.
2. Run `npm ci`.
3. Run `npm run init`.
4. Run `npm run dev`.

Before review run lint, typecheck, build and every characterization suite. Schema changes must be additive, idempotent and placed in a versioned migration. UI components call APIs; they do not query PostgreSQL. Cross-context code consumes references, snapshots or events and never writes another module's tables.

New analytical metrics must identify their authoritative source and currency/unit. Missing evidence produces `Unavailable`. Tests may use explicit local fixtures but production paths must never fabricate records.

Use structured logs without email, tokens, cookies, authorization headers or provider payloads. Instrument expensive operations with `traced`. Cache keys must include organization ID and be invalidated after authoritative snapshot refresh.
