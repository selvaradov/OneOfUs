#!/bin/bash

# TypeScript Type Checking Script
# Run this before committing to catch syntax errors, unclosed tags, etc.

set -e  # Exit on any error

echo "🔍 Running TypeScript type checks..."
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Run TypeScript compiler in check mode
echo "Checking TypeScript files..."
if npx tsc --noEmit --pretty 2>&1; then
    echo ""
    echo -e "${GREEN}✓ TypeScript check passed!${NC}"
    echo "No type errors or syntax issues found."
    exit 0
else
    echo ""
    echo -e "${RED}✗ TypeScript check failed!${NC}"
    echo ""
    echo "Common issues:"
    echo "  - Unclosed JSX tags (missing </div>, etc.)"
    echo "  - Type mismatches"
    echo "  - Syntax errors"
    echo ""
    echo "Fix the errors above before committing."
    exit 1
fi
