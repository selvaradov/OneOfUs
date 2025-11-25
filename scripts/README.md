# Test Scripts

Automated tests to verify database integration is working correctly.

## Scripts

### `verify-setup.sh` - Quick Setup Check
Verifies that all files and configuration are in place.

**What it checks:**
- ✅ `.env.local` exists and has required variables
- ✅ Database files exist (`lib/db.ts`, `db/schema.sql`)
- ✅ All API endpoints are present
- ✅ Dev server is running
- ✅ Database connection works

**Run it:**
```bash
./scripts/verify-setup.sh
```

**When to use:** Before running tests, to make sure everything is configured.

---

### `test-database.sh` - Full Integration Test
Tests all database endpoints with actual API calls.

**What it tests:**
1. `/api/init-db` - Database initialization endpoint
2. `/api/user` POST - Creates a test user
3. `/api/user` GET - Retrieves user info
4. `/api/stats?userId=` - Gets user statistics
5. `/api/history?userId=` - Gets user history
6. `/api/stats?type=prompts` - Gets global prompt analytics
7. Database connectivity - Verifies database is accessible

**Run it:**
```bash
# Make sure dev server is running first
npm run dev

# In another terminal:
./scripts/test-database.sh
```

**Output example:**
```
🧪 Testing database integration at http://localhost:3000
================================================

Test 1: Check /api/init-db endpoint
------------------------------------
✓ PASS: init-db endpoint is accessible (HTTP 200)

Test 2: Create test user via /api/user
---------------------------------------
Response: {"success":true,"userId":"abc-123-def"}
✓ PASS: User created successfully with ID: abc-123-def

...

================================================
TEST SUMMARY
================================================
Total tests: 7
Passed: 7
Failed: 0

✓ All tests passed!
```

**What each test does:**
- Creates a temporary user in the database
- Verifies all API endpoints respond correctly
- Checks that database queries work
- Tests both user-specific and global analytics

**Note:** Test creates real records in your database. They're harmless but will appear in your Neon console.

---

### Testing in Production

To test your production deployment:

```bash
# Set the base URL to your production domain
BASE_URL=https://your-domain.vercel.app ./scripts/test-database.sh
```

**Important:** You'll need to set `INIT_DB_SECRET` in Vercel first if testing initialization.

---

## Manual Testing

After automated tests pass, manually verify:

1. **Browser test:**
   - Open http://localhost:3000
   - Complete onboarding
   - Check browser console for: `User created in database with ID: ...`

2. **Play a game:**
   - Write a response and submit
   - Check console for: `Game session saved to database for user: ...`

3. **Check history:**
   - Go to http://localhost:3000/history
   - Should see your games loaded from database
   - Should NOT see "Showing local data" indicator

4. **Verify in Neon:**
   - Go to https://console.neon.tech/
   - Select your database
   - SQL Editor: `SELECT * FROM game_sessions ORDER BY created_at DESC LIMIT 5;`
   - Should see your test sessions

---

## Troubleshooting

### "Database connection unavailable"
- Check `.env.local` has `POSTGRES_URL` set
- Verify you ran `vercel env pull .env.local`
- Check Neon database is active in console

### "init-db endpoint returned HTTP 401"
- In production: Need to set `INIT_DB_SECRET` and pass as Bearer token
- In development: Should return 200, not 401

### "Failed to create user"
- Check database was initialized: `curl -X POST http://localhost:3000/api/init-db`
- Verify tables exist in Neon SQL Editor

### Tests pass but browser console shows localStorage
- Clear browser localStorage: `localStorage.clear()` in console
- Refresh and complete onboarding again
- Should now use database

---

## Development Workflow

**First time setup:**
```bash
./scripts/verify-setup.sh    # Check configuration
npm run dev                   # Start server
./scripts/test-database.sh    # Run tests
```

**Before committing changes:**
```bash
./scripts/test-database.sh    # Verify nothing broke
```

**Before deploying to production:**
```bash
BASE_URL=https://your-preview.vercel.app ./scripts/test-database.sh
```
