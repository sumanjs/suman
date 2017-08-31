#!/usr/bin/env bash

set -e;

git fetch origin
git checkout dev
git merge origin/dev

time_millis=$(node -e 'console.log(Date.now())');

NEW_FEATURE_BRANCH="feature_${USER}_${time_millis}"

git checkout -b "${NEW_FEATURE_BRANCH}"
git push -u origin HEAD  # makes sure git is tracking this branch on the primary remote
