#!/bin/bash

# Pre-deployment checklist script
# Run this before deploying to staging or production

set -e

echo "🚀 Running pre-deployment checks..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check counter
CHECKS_PASSED=0
CHECKS_FAILED=0

# Function to print success
print_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

# Function to print error
print_error() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "1. Checking Node.js version..."
NODE_VERSION=$(node -v)
if [[ $NODE_VERSION == v18* ]] || [[ $NODE_VERSION == v20* ]]; then
    print_success "Node.js version: $NODE_VERSION"
else
    print_warning "Node.js version $NODE_VERSION (recommended: v18 or v20)"
fi
echo ""

echo "2. Running type check..."
if npm run typecheck > /dev/null 2>&1; then
    print_success "Type check passed"
else
    print_error "Type check failed"
fi
echo ""

echo "3. Running linter..."
if npm run lint > /dev/null 2>&1; then
    print_success "Linting passed"
else
    print_warning "Linting has warnings (check manually)"
fi
echo ""

echo "4. Building Next.js application..."
if npm run build > /dev/null 2>&1; then
    print_success "Next.js build successful"
else
    print_error "Next.js build failed"
fi
echo ""

echo "5. Building Cloud Functions..."
if (cd functions && npm run build > /dev/null 2>&1); then
    print_success "Cloud Functions build successful"
else
    print_error "Cloud Functions build failed"
fi
echo ""

echo "6. Checking environment variables..."
if [ -f .env.local ] || [ -f .env.production ]; then
    print_success "Environment file found"
else
    print_warning "No environment file found (.env.local or .env.production)"
fi
echo ""

echo "7. Checking Firebase configuration..."
if [ -f .firebaserc ]; then
    print_success "Firebase configuration found"
else
    print_warning "No .firebaserc file found"
fi
echo ""

echo "8. Checking Firestore rules..."
if [ -f firestore.rules ]; then
    print_success "Firestore rules file found"
else
    print_error "Firestore rules file not found"
fi
echo ""

echo "9. Checking Firestore indexes..."
if [ -f firestore.indexes.json ]; then
    print_success "Firestore indexes file found"
else
    print_warning "Firestore indexes file not found"
fi
echo ""

echo "10. Checking security rules tests..."
if npm run test:rules > /dev/null 2>&1; then
    print_success "Security rules tests passed"
else
    print_warning "Security rules tests failed or not configured"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary:"
echo -e "${GREEN}Passed: $CHECKS_PASSED${NC}"
echo -e "${RED}Failed: $CHECKS_FAILED${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed! Ready to deploy.${NC}"
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please fix the issues before deploying.${NC}"
    exit 1
fi
