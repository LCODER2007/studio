#!/bin/bash

# Script to validate Firestore security rules syntax
# This checks if the rules file is syntactically correct

echo "Validating Firestore security rules..."

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null; then
    echo "Error: firebase-tools is not installed"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if firestore.rules exists
if [ ! -f "firestore.rules" ]; then
    echo "Error: firestore.rules file not found"
    exit 1
fi

# Validate the rules file
firebase firestore:rules:validate firestore.rules

if [ $? -eq 0 ]; then
    echo "✓ Security rules are valid!"
    exit 0
else
    echo "✗ Security rules validation failed"
    exit 1
fi
