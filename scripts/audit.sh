#!/bin/bash

# Audit Script for Nina Armend Repository

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

# 3. Run Linting
echo "Running Linter..."
npm run lint > /dev/null 2>&1
if [ $? -ne 0 ]; then
    AUDIT_RESULTS+="- Linting checks failed. Run 'npm run lint' for details.\n"
    HAS_ISSUES=true
fi

# 4. Check for Outdated Dependencies
echo "Checking for outdated dependencies..."
npm outdated > /dev/null 2>&1
if [ $? -ne 0 ]; then
    AUDIT_RESULTS+="- Some dependencies are outdated.\n"
    HAS_ISSUES=true
fi

# 5. Security Audit
echo "Running Security Audit..."
npm audit --audit-level=high > /dev/null 2>&1
if [ $? -ne 0 ]; then
    AUDIT_RESULTS+="- High-level security vulnerabilities found. Run 'npm audit' for details.\n"
    HAS_ISSUES=true
fi

if [ "$HAS_ISSUES" = true ]; then
    echo -e "Audit found potential optimizations:\n$AUDIT_RESULTS"
    # Create a temporary file to store results for the GitHub Action
    echo -e "$AUDIT_RESULTS" > audit_report.md
    exit 1
else
    echo "Audit passed! No issues found."
    exit 0
fi
