#!/usr/bin/env bash

GIT_COMMIT_MSG = $1 # first argument to script

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "dev" ]]; then
  echo 'Aborting script because you are not on the right git branch (dev).';
  exit 1;
fi

git add . &&
git add -A &&
git commit -am "publish/release:${GIT_COMMIT_MSG}" &&
git push &&
git checkout -b master &&
npm run remove-private-dirs &&
npm run remove-private-files &&
git add . &&
git add -A &&
git commit -am "publish/release:${GIT_COMMIT_MSG}" &&
git push origin master -f &&
git checkout dev &&
git branch -D master
