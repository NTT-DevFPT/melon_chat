#!/bin/bash

echo "Running tests..."

# Test backend
echo "Testing backend..."
cd apps/backend
mvn test
cd ../..

echo "All tests completed!"
