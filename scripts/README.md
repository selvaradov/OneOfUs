# Scripts & Testing

Automated tests and checks to verify code quality and database integration.

## Pre-Commit Workflow

**IMPORTANT: Run type checks before every commit to prevent syntax errors and broken code.**

### Quick Workflow

```bash
# 1. Run type check (REQUIRED)
./scripts/check-types.sh

# 2. Run tests (recommended)
./scripts/test-database.sh

# 3. If checks pass, commit
git add .
git commit -m "Your message"
```

### Automated Pre-Commit Hook (Optional)

Enable automatic checks before every commit:

```bash
./scripts/setup-git-hooks.sh
```

This blocks commits if TypeScript errors exist.

---

## Available Scripts

### `check-types.sh` - TypeScript Type Check ⚠️ **REQUIRED BEFORE COMMITS**

Catches syntax errors, unclosed JSX tags, and type errors before they break the build.

```bash
./scripts/check-types.sh
```

**What it catches:**

- ✅ Unclosed JSX tags (missing `</div>`, `</span>`, etc.)
- ✅ TypeScript type errors
- ✅ Syntax errors in .ts/.tsx files
- ✅ Import/export issues

**Output example:**

```bash
🔍 Running TypeScript type checks...
✓ TypeScript check passed!
No type errors or syntax issues found.
```

### `test-database.sh` - Full Integration Test

Tests all database endpoints with actual API calls.

```bash
# Start dev server first
npm run dev

# Run tests in another terminal
./scripts/test-database.sh
```

**What it tests:**

1. Database initialization (`/api/init-db`)
2. User creation and retrieval (`/api/user`)
3. User statistics (`/api/stats?userId=`)
4. Game history (`/api/history?userId=`)
5. Global prompt analytics (`/api/stats?type=prompts`)
6. Analytics table population
7. Database connectivity

**Testing production:**

```bash
BASE_URL=https://your-domain.vercel.app ./scripts/test-database.sh
```

### `test-rate-limit.sh` - Rate Limiting Test

Tests rate limiting implementation for the `/api/grade` endpoint.

```bash
./scripts/test-rate-limit.sh
```

### `setup-git-hooks.sh` - Install Pre-Commit Hooks

Sets up automatic type checking before commits.

```bash
./scripts/setup-git-hooks.sh
```

**To bypass (not recommended):**

```bash
git commit --no-verify
```

### `verify-setup.sh` - Setup Verification

Quick check that all files and configuration are in place.

```bash
./scripts/verify-setup.sh
```

**Checks:**

- ✅ `.env.local` exists with required variables
- ✅ Database files exist
- ✅ All API endpoints are present
- ✅ Dev server is running
- ✅ Database connection works

## Development Workflow

### First Time Setup

```bash
./scripts/setup-git-hooks.sh  # Enable pre-commit checks (recommended)
./scripts/verify-setup.sh     # Check configuration
npm run dev                    # Start server
./scripts/test-database.sh    # Run tests
```

### Before Committing (CRITICAL)

```bash
./scripts/check-types.sh      # Type check (REQUIRED)
./scripts/test-database.sh    # Verify nothing broke (recommended)

# If checks pass:
git add .
git commit -m "Your message"
```

### Before Deploying to Production

```bash
./scripts/check-types.sh
BASE_URL=https://your-preview.vercel.app ./scripts/test-database.sh
```

---

## Manual Testing

After automated tests pass, manually verify:

### Browser Test

1. Open http://localhost:3000
2. Complete onboarding
3. Check console: `User created in database with ID: ...`

### Play a Game

1. Write and submit a response
2. Check console: `Game session saved to database for user: ...`

### Check History

1. Visit http://localhost:3000/history
2. Games should load from database
3. Should NOT see "Showing local data" indicator

### Verify in Neon

1. Go to https://console.neon.tech/
2. SQL Editor: `SELECT * FROM game_sessions ORDER BY created_at DESC LIMIT 5;`
3. Should see your test sessions

---

## Troubleshooting

### "Database connection unavailable"

- Check `.env.local` has `POSTGRES_URL` set
- Verify database is active in Neon console
- Run `curl -X POST http://localhost:3000/api/init-db`

### "init-db endpoint returned HTTP 401"

- Production requires `INIT_DB_SECRET` as Bearer token
- Development should return 200

### "Failed to create user"

- Initialize database: `curl -X POST http://localhost:3000/api/init-db`
- Verify tables exist in Neon SQL Editor

### Tests pass but browser uses localStorage

- Clear browser localStorage: `localStorage.clear()` in console
- Refresh and complete onboarding again

### Type Check Fails

1. Read error output carefully
2. Fix issues (usually unclosed tags or type errors)
3. Re-run `./scripts/check-types.sh`
4. Only commit when checks pass
