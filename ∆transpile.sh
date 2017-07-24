#!/usr/bin/env bash


cd $(dirname "$0") &&
tsc --project tsconfig.json              # builds the project
tsc --project tsconfig-test.json         # builds the tests
echo "all done transpiling"
