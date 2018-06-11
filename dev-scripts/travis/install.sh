#!/usr/bin/env bash

set -e;

npm install --loglevel="warn"

tsc || echo "whatevs"

npm link -f
npm link suman

