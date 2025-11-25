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

# Pre-commit hook: Run TypeScript type checks before allowing commit

echo "Running pre-commit checks..."
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
echo "✓ Pre-commit checks passed!"
echo ""
EOF

chmod +x "$HOOK_FILE"

echo "✓ Pre-commit hook installed at $HOOK_FILE"
echo ""
echo "This hook will:"
echo "  - Run TypeScript type checks before every commit"
echo "  - Catch unclosed JSX tags and syntax errors"
echo "  - Prevent commits if errors are found"
echo ""
echo "To bypass the hook (not recommended):"
echo "  git commit --no-verify"
echo ""
echo "✓ Setup complete!"
