#!/usr/bin/env bash

set -e;

git clone git@github.com:sumanjs/suman.git
git checkout dev

# link the project to itself for testing
npm link
npm link suman

time_millis=$(node -e 'console.log(Date.now())');

git checkout -b "feature/$USER/${time_millis}"
