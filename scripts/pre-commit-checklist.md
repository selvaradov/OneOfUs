# Pre-Commit Checklist for Claude Code

**IMPORTANT: Run these checks before every commit to prevent syntax errors and broken code.**

## Automated Checks (Required)

### 1. TypeScript Type Check
```bash
./scripts/check-types.sh
```

**What it catches:**
- ✅ Unclosed JSX tags (missing `</div>`, etc.)
- ✅ Type errors and mismatches
- ✅ Syntax errors in TypeScript/TSX files
- ✅ Import errors

**When to run:** Before every `git commit`

**Fix issues before committing!** Do not proceed if this fails.

---

## Optional: Automated Pre-Commit Hook

To automatically run checks before every commit:

```bash
./scripts/setup-git-hooks.sh
```

This installs a pre-commit hook that blocks commits if TypeScript errors exist.

---

## Manual Checks (Recommended)

### 2. Test Suite
```bash
# Make sure dev server is running
npm run dev

# In another terminal:
./scripts/test-database.sh
```

### 3. Visual Check
- Open http://localhost:3000 in browser
- Navigate through: Home → Game → Results → History
- Check console for errors

---

## When Editing JSX/TSX Files

**Common mistakes that checks catch:**

❌ **Unclosed div tags**
```tsx
<div className="container">
  <div className="content">
    {/* Missing closing tags */}
</div>  // ← ERROR: Only closes outer div
```

✅ **Properly closed tags**
```tsx
<div className="container">
  <div className="content">
    {/* Content */}
  </div>  // ← Closes inner div
</div>    // ← Closes outer div
```

❌ **Missing fragments**
```tsx
return (
  <Header />
  <Footer />  // ← ERROR: Multiple root elements
);
```

✅ **Using fragments**
```tsx
return (
  <>
    <Header />
    <Footer />
  </>
);
```

---

## Integration with Claude Code Workflow

### Before Committing
```bash
# 1. Run type check (REQUIRED)
./scripts/check-types.sh

# 2. If passing, proceed with commit
git add .
git commit -m "Your message"
```

### If Type Check Fails
1. Read the error output carefully
2. Fix the issues (usually unclosed tags or type errors)
3. Re-run `./scripts/check-types.sh`
4. Only commit when checks pass

---

## Self-Reminder for Claude Code

**ALWAYS run `./scripts/check-types.sh` before committing!**

When making multi-file edits:
1. Use Read tool to check file structure before editing
2. Count opening and closing tags carefully
3. Run type check after all edits
4. Fix any errors before committing

This prevents broken builds and syntax errors from entering the codebase.
