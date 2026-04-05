#!/bin/bash

# Audit Script for Nina Armend Repository
# Updated to check for messed up logic flows and run builds.

echo "Starting Repository Audit..."
AUDIT_RESULTS=""
HAS_ISSUES=false

# 1. Check for 'TODO' and 'FIXME'
echo "Checking for TODOs and FIXMEs..."
TODO_COUNT=$(grep -rnEi "TODO|FIXME" src | wc -l)
if [ "$TODO_COUNT" -gt 0 ]; then
    AUDIT_RESULTS+="- Found $TODO_COUNT TODO/FIXME markers in 'src/'.\n"
    HAS_ISSUES=true
fi

# 2. Check for 'console.log'
echo "Checking for console.logs..."
CONSOLE_COUNT=$(grep -rn "console.log" src | wc -l)
if [ "$CONSOLE_COUNT" -gt 0 ]; then
    AUDIT_RESULTS+="- Found $CONSOLE_COUNT 'console.log' statements in 'src/'.\n"
    HAS_ISSUES=true
fi

# 3. Check for 'getSession()' in hooks (known to cause hangs)
echo "Checking for getSession() in hooks..."
GET_SESSION_HOOKS=$(grep -rl "getSession" src/hooks | grep -v "useProductsDb.ts")
if [ -n "$GET_SESSION_HOOKS" ]; then
    AUDIT_RESULTS+="- Found 'getSession()' in restricted hooks (may cause hangs):\n$GET_SESSION_HOOKS\n"
    HAS_ISSUES=true
fi

# 4. Check for Supabase onConflict with spaces (invalid parsing)
echo "Checking for Supabase onConflict with spaces..."
ON_CONFLICT_SPACES=$(grep -rn "onConflict: '.*, .*'" src)
if [ -n "$ON_CONFLICT_SPACES" ]; then
    AUDIT_RESULTS+="- Found 'onConflict' with spaces (breaks Supabase parsing):\n$ON_CONFLICT_SPACES\n"
    HAS_ISSUES=true
fi

# 5. Check for unnormalized handles in useProduct lookups
echo "Checking for unnormalized handle lookups..."
# Look for useProduct(handle) where handle might not be toHandle(handle)
# This is a bit complex for a simple grep, but we can look for common patterns
UNNORMALIZED_HANDLES=$(grep -rn "useProduct(" src | grep -v "toHandle" | grep -v "useProduct('')")
if [ -n "$UNNORMALIZED_HANDLES" ]; then
    # We allow cases where the variable itself is passed, but warn if it's likely raw from useParams
    AUDIT_RESULTS+="- Found potential unnormalized handle lookups in useProduct():\n$UNNORMALIZED_HANDLES\n"
    HAS_ISSUES=true
fi

# 6. Run Linting
echo "Running Linter..."
npm run lint > /dev/null 2>&1
if [ $? -ne 0 ]; then
    AUDIT_RESULTS+="- Linting checks failed. Run 'npm run lint' for details.\n"
    HAS_ISSUES=true
fi

# 7. Run Build (Crucial check)
echo "Running Build..."
npm run build > /dev/null 2>&1
if [ $? -ne 0 ]; then
    AUDIT_RESULTS+="- Build failed. Run 'npm run build' for details.\n"
    HAS_ISSUES=true
fi

# 8. Check for Outdated Dependencies
echo "Checking for outdated dependencies..."
npm outdated > /dev/null 2>&1
if [ $? -ne 0 ]; then
    AUDIT_RESULTS+="- Some dependencies are outdated.\n"
    HAS_ISSUES=true
fi

# 9. Security Audit
echo "Running Security Audit..."
npm audit --audit-level=high > /dev/null 2>&1
if [ $? -ne 0 ]; then
    AUDIT_RESULTS+="- High-level security vulnerabilities found. Run 'npm audit' for details.\n"
    HAS_ISSUES=true
fi

if [ "$HAS_ISSUES" = true ]; then
    echo -e "Audit found potential issues or optimizations:\n$AUDIT_RESULTS"
    # Create a temporary file to store results for the GitHub Action
    echo -e "$AUDIT_RESULTS" > audit_report.md
    exit 1
else
    echo "Audit passed! No issues found."
    exit 0
fi
