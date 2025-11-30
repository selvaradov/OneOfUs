#!/bin/bash

# Setup Git Hooks for Automated Checks
# Run this once to enable pre-commit type checking

set -e

echo "🔧 Setting up Git hooks..."
echo "================================================"
echo ""

# Create pre-commit hook
HOOK_FILE=".git/hooks/pre-commit"

cat > "$HOOK_FILE" << 'EOF'
#!/bin/bash

# Pre-commit hook: Format with Prettier and run TypeScript type checks

echo "Running pre-commit checks..."
echo ""

# Format staged files with Prettier
echo "🎨 Formatting code with Prettier..."
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx|json|css|md)$' || true)

if [ -n "$STAGED_FILES" ]; then
    # Format files
    npx prettier --write $STAGED_FILES

    # Re-add formatted files to staging
    git add $STAGED_FILES

    echo "✓ Code formatted"
else
    echo "No files to format"
fi

echo ""

# Run type check
if ! ./scripts/check-types.sh; then
    echo ""
    echo "❌ Commit blocked: Fix TypeScript errors first"
    echo ""
    echo "To bypass this check (not recommended):"
    echo "  git commit --no-verify"
    echo ""
    exit 1
fi

echo ""

# Run linter
if ! npm run lint; then
    echo ""
    echo "❌ Commit blocked: Fix linting errors first"
    echo ""
    echo "Try auto-fixing issues:"
    echo "  npm run lint -- --fix"
    echo ""
    echo "To bypass this check (not recommended):"
    echo "  git commit --no-verify"
    echo ""
    exit 1
fi

echo ""
echo "✓ Pre-commit checks passed!"
echo ""
EOF

chmod +x "$HOOK_FILE"

echo "✓ Pre-commit hook installed at $HOOK_FILE"
echo ""
echo "This hook will:"
echo "  - Auto-format code with Prettier before every commit"
echo "  - Run TypeScript type checks before every commit"
echo "  - Run ESLint linter checks before every commit"
echo "  - Catch unclosed JSX tags, syntax errors, and code quality issues"
echo "  - Prevent commits if errors are found"
echo ""
echo "To bypass the hook (not recommended):"
echo "  git commit --no-verify"
echo ""
echo "✓ Setup complete!"
