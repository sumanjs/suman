#!/usr/bin/env bash

set -e;

git clone git@github.com:sumanjs/suman.git
git checkout dev

time_millis=$(node -e 'console.log(Date.now())');

git checkout -b "feature/$USER/${time_millis}"
