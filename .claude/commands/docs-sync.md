---
description: Validate documentation matches codebase (types, schema, architecture, features)
allowed-tools: Glob, Grep, Read, Edit, Bash(git log:*), Bash(git diff:*)
---

# Documentation Sync Validation

Validate that documentation in `/docs` accurately reflects the current codebase. Prevents outdated documentation that misleads developers and AI assistants.

## Why This Matters

Documentation drift is a common problem. When code changes but docs don't get updated:

- Developers waste time following outdated patterns
- New team members learn incorrect information
- AI assistants make wrong assumptions about the codebase

## Validation Checks

Run each check below and report discrepancies.

### 1. Data Model Sync

**Source of Truth:** `src/shared/types/database.ts`, `src/shared/types/models.ts`, `src/shared/types/enums.ts`, `src/shared/types/ids.ts`
**Database Schema:** `supabase/migrations/*.sql`
**Documentation:** `docs/datamodel.md`

Verify these match:

- [ ] All TypeScript types/interfaces documented match actual definitions
- [ ] Branded ID types match (`ItemId`, `UserId`, etc. from `ids.ts`)
- [ ] Enum values match between `enums.ts` and docs
- [ ] Database tables described match current migration state
- [ ] Column names, types, and constraints match
- [ ] Relationships (foreign keys) are accurately documented
- [ ] Any new migrations not reflected in docs

### 2. Feature Slices Architecture Sync

**Source of Truth:** `src/features/` directory structure
**Documentation:** `docs/architecture.md`, `docs/system-architecture.md`

Verify these match:

- [ ] All feature directories listed: `auth`, `bikes`, `borrow`, `demo`, `exchange`, `groups`, `inventory`, `locations`, `messaging`, `notifications`, `onboarding`, `profile`, `ratings`, `search`
- [ ] Components listed in docs exist in codebase
- [ ] Directory structure diagrams match actual structure
- [ ] Hook names match actual hooks
- [ ] Context/Provider names match
- [ ] No phantom features (documented but don't exist)
- [ ] No undocumented feature slices

### 3. Functional Specs Sync

**Source of Truth:** Implemented features in `src/features/` and `app/`
**Documentation:** `docs/functional-specs.md`

Verify:

- [ ] Features described as implemented are actually implemented
- [ ] User flows documented match actual navigation (Expo Router routes in `app/`)
- [ ] Screen names and purposes match actual screens
- [ ] Features marked as planned/future — check if now implemented
- [ ] No documented features that have been removed

### 4. Technical Specs Sync

**Source of Truth:** `package.json`, `tsconfig.json`, `app.config.ts`, actual code patterns
**Documentation:** `docs/technical-specs.md`

Verify:

- [ ] Tech stack versions match `package.json` dependencies
- [ ] Patterns described match actual code patterns used
- [ ] Testing setup matches actual config (`jest.config.js`, `playwright.config.ts`)
- [ ] Build/deploy configuration matches actual setup
- [ ] API patterns match actual Supabase client usage

### 5. Security Documentation Sync

**Source of Truth:** `supabase/migrations/*.sql` (RLS policies), `src/features/auth/`
**Documentation:** `docs/security.md`

Verify:

- [ ] RLS policies documented match actual migration SQL
- [ ] Auth flow description matches implementation
- [ ] Privacy/GDPR claims match actual data handling
- [ ] API security measures match actual middleware/policies

### 6. Feature Design Specs Sync

**Source of Truth:** Implemented features
**Documentation:** `docs/feature-design.md`, `docs/design-docs/*.md`

For each design spec, verify:

- [ ] Features described are actually implemented
- [ ] Code locations referenced exist
- [ ] API/interface contracts match actual implementation
- [ ] If spec mentions "planned" or "future", check if now implemented
- [ ] Screen-level UX specs match actual component behavior

### 7. Development & Testing Docs Sync

**Source of Truth:** `package.json` scripts, actual config files
**Documentation:** `docs/development.md`, `docs/testing.md`, `docs/code-quality.md`

Verify:

- [ ] All npm scripts documented match actual `package.json` scripts
- [ ] Setup instructions are accurate and complete
- [ ] Test commands and configuration match actual setup
- [ ] ESLint/Prettier config matches documented rules
- [ ] Environment variables documented match actual usage

### 8. File References Validation

Check that documentation links and paths point to existing files:

- [ ] All `src/` paths in docs point to existing files
- [ ] Import statements shown in docs would work
- [ ] Any cross-doc links are valid
- [ ] Supabase migration references are correct

### 9. Git History Analysis

Check git history for documentation drift signals:

**Source vs Docs modification dates:**

```bash
# Check when key source files were last modified vs their docs
git log -1 --format="%ci" -- src/shared/types/
git log -1 --format="%ci" -- docs/datamodel.md

git log -1 --format="%ci" -- src/features/
git log -1 --format="%ci" -- docs/architecture.md

git log -1 --format="%ci" -- supabase/migrations/
git log -1 --format="%ci" -- docs/security.md
```

**Recent commits touching source without docs:**

```bash
# Find commits that modified source but not docs
git log --oneline --since="3 months ago" -- src/shared/types/
git log --oneline --since="3 months ago" -- docs/datamodel.md
```

Flag commits where:

- [ ] Types changed but `datamodel.md` didn't update
- [ ] New migrations added but `security.md` not updated (if RLS-related)
- [ ] New features added to `src/features/` without doc updates
- [ ] `package.json` scripts changed but `development.md`/`testing.md` not updated

**Staleness thresholds:**

- ⚠️ Warning: Doc not updated in 30+ days while source changed
- ❌ Critical: Doc not updated in 90+ days while source changed multiple times

## Output Format

Report results in this format:

```text
Documentation Sync Validation Results
=====================================

1. Data Model Sync
   - datamodel.md → src/shared/types/, supabase/migrations/
   - Status: ✅ In Sync / ⚠️ Discrepancies Found
   - Issues: [list any mismatches]

2. Feature Slices Architecture Sync
   - architecture.md → src/features/
   - Status: ✅ In Sync / ⚠️ Discrepancies Found
   - Missing from docs: [features in code but not docs]
   - Phantom in docs: [features in docs but not code]

3. Functional Specs Sync
   - Status: ✅ In Sync / ⚠️ Discrepancies Found
   - Issues: [list any gaps]

4. Technical Specs Sync
   - Status: ✅ In Sync / ⚠️ Discrepancies Found
   - Issues: [list any mismatches]

5. Security Documentation Sync
   - Status: ✅ In Sync / ⚠️ Discrepancies Found
   - Issues: [list any gaps]

6. Feature Design Specs Sync
   - [spec-name]: ✅ Implemented / ⚠️ Partially / ❌ Not Implemented
   - Issues: [list any gaps]

7. Development & Testing Docs Sync
   - Status: ✅ In Sync / ⚠️ Discrepancies Found
   - Issues: [list any mismatches]

8. File References
   - Status: ✅ All Valid / ⚠️ Broken Links Found
   - Broken: [list broken paths]

9. Git History Analysis
   - Status: ✅ In Sync / ⚠️ Drift Detected / ❌ Stale Docs
   - Source files modified after docs:
     - [file]: last source change [date], last doc change [date]

Summary
-------
- Total checks: X
- Passed: X
- Issues: X

Recommended Actions:
1. [Most critical fix]
2. [Second priority]
...
```

## Arguments

- No arguments: Run all checks and report discrepancies
- `quick`: Only run checks 1-2 (data model, feature slices)
- `datamodel`: Only check data model sync
- `architecture`: Only check feature slices architecture
- `specs`: Only check functional and technical specs
- `security`: Only check security documentation
- `design`: Only check feature design specs
- `git`: Only check git history for drift signals
- `fix`: **Run checks AND automatically fix discrepancies** in documentation files

## Fix Mode Behavior

When `fix` argument is provided, after identifying discrepancies:

1. **Automatically update documentation files** using the Edit tool to match the source code
2. **Sync data model docs** - Update types, enums, tables, relationships in `datamodel.md`
3. **Sync architecture docs** - Add missing feature slices, fix directory structures
4. **Update technical specs** - Fix dependency versions, script references
5. **Update testing docs** - Fix test counts, commands, configuration
6. **Report all changes made** with before/after summary

**What fix mode will NOT do:**

- Change source code (only documentation is updated)
- Delete documentation sections (only updates existing content)
- Modify design docs in `docs/design-docs/` without review (these are authoritative feature documentation)

## Tips

1. **Start with quick mode** for regular validation during development
2. **Run full validation** before major releases or documentation updates
3. **Use fix mode** to automatically correct documentation drift
4. **Check design specs** when implementing features to ensure alignment
5. **Review changes** after fix mode — verify updates are correct before committing
