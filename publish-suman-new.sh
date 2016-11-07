#!/usr/bin/env bash

# GIT_COMMIT_MSG = $1 # first argument to script

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "dev" ]]; then
  echo 'Aborting script because you are not on the right git branch (dev).';
  exit 1;
fi

### start of the end ###
npm version patch --force -m "Upgrade for several reasons" && # bump version
git add . &&
git add -A &&
git commit --allow-empty -am "publish/release:$1" &&
git push &&
git checkout -b devtemp &&
./delete-internal-paths.sh &&
git rm delete-internal-paths.sh -f &&
git add . &&
git add -A &&
git reset --soft HEAD~10 &&
git commit -am "publish/release:$1" &&
git push public master -f &&
git checkout dev &&
git branch -D devtemp &&
npm publish .


