#!/usr/bin/env bash

set -e;

npm link -f --silent > /dev/null 2>&1
npm link suman -f --silent  > /dev/null 2>&1
suman --force test/src/dev/node/injection.test.js
