# AGENTS.md

## Purpose

This repository builds an **NFL Draft Board Social** platform.

The product has 4 core pillars:

1. **Prospect Hub**
   - Prospect catalog
   - Individual player pages
   - Rankings, filters, search

2. **User Draft Boards**
   - Users create and manage their own draft boards
   - Reorder prospects with drag-and-drop
   - Save, duplicate, publish, and share boards

3. **Community Chat**
   - Global NFL chat
   - Team-specific chat rooms
   - Event-driven draft discussion

4. **NFL News Feed**
   - Relevant NFL and draft news
   - Articles linked to prospects and teams
   - Automated sync from external providers

This file defines how coding agents must operate in this repository.

---

## Source of truth

Always use these files as the primary reference, in this order:

1. `ROADMAP.md`
2. `ARCHITECTURE.md`
3. `PRD.md`
4. `AGENTS.md`

If there is conflict:
- `ROADMAP.md` defines delivery order and milestone scope
- `ARCHITECTURE.md` defines technical structure
- `PRD.md` defines product behavior
- `AGENTS.md` defines execution rules

Do not invent a parallel architecture.

---

## Execution model

Work **one milestone at a time**.

Before implementing anything:

1. Identify the active milestone from `ROADMAP.md`
2. Confirm scope boundaries
3. Show the file tree you intend to create or modify
4. Implement only what belongs to that milestone
5. Summarize the changes clearly

Do not jump ahead unless explicitly instructed.

---

## Mandatory workflow

For every task, follow this exact sequence:

### 1. Understand
- Read the active milestone
- Identify impacted modules
- Respect existing conventions

### 2. Plan
- List files to create or modify
- Explain why each file is needed
- Keep the plan short and concrete

### 3. Implement
- Produce production-quality code
- Avoid placeholder-only code unless explicitly requested
- Prefer small, composable modules

### 4. Validate
Check:
- types
- imports
- runtime safety
- loading state
- empty state
- error state
- permission/auth implications

### 5. Report
Always end with:
- what was done
- files created
- files changed
- commands to run
- known limitations
- next logical step

---

## Project principles

### 1. Never couple UI directly to external providers
External APIs must always go through internal adapters.

Allowed:
- UI -> service -> internal domain model -> provider adapter

Not allowed:
- UI -> raw external provider response

### 2. Internal schema is the contract
External data can change. The app must depend on internal normalized models.

### 3. Build thin UI, strong domain
Keep domain logic outside presentation components.

### 4. Default to server-safe design
Assume any client input is untrusted.

### 5. Ship vertically
Prefer complete thin slices over wide unfinished scaffolding.

Bad:
- 12 pages with placeholders

Good:
- 1 complete feature with real flows

---

## Repository expectations

Expected structure:

```txt
apps/
  web/
    src/
      app/
      components/
      features/
      hooks/
      lib/
      services/
      types/

packages/
  domain/
  ui/
  config/
  providers/

supabase/
  migrations/
  seeds/

docs/