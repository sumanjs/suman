#!/usr/bin/env bash

GIT_COMMIT_MSG = $1 # first argument to script

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "dev" ]]; then
  echo 'Aborting script because you are not on the right git branch (dev).';
  exit 1;
fi

#
npm version patch --force -m "Upgrade for several reasons" && # bump version
git add . &&
git add -A &&
git commit -am "publish/release:${GIT_COMMIT_MSG}" &&
git push &&
git checkout -b devtemp &&
npm run remove-private-dirs &&
npm run remove-private-files &&
git add . &&
git add -A &&
git commit -am "publish/release:${GIT_COMMIT_MSG}" &&
git remote add public git@github.com:ORESoftware/suman.git
git fetch public &&
git checkout -b temp public/master &&
git merge -Xtheirs --squash -m "squashed with devtemp" devtemp
npm run remove-private-dirs &&
npm run remove-private-files &&
git add . &&
git add -A &&
git commit -am "publish/release:${GIT_COMMIT_MSG}" &&
git push public temp:master &&
git remote rm public &&
git checkout dev &&
git branch -D devtemp &&
git branch -D temp &&
npm publish .


