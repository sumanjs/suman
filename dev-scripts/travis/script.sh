#!/usr/bin/env bash

set -e;

#npm link -f --silent > /dev/null 2>&1
#npm link suman -f --silent  > /dev/null 2>&1

cat dist/cli.js
cat dist/s.js

suman --force test/src/dev/node/3.test.js
