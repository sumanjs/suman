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
git remote add public git@github.com:ORESoftware/suman.git
git fetch public &&
# git checkout -b master
git checkout -b temp public/master &&
git merge -s ours --squash -m "squashed with dev" dev &&
#git add .
#git add -A
#git commit -am "publish/release:${GIT_COMMIT_MSG}"
#git add .
#git add -A
#git commit -am "publish/release:${GIT_COMMIT_MSG}"
## git remote add publish git@github.com:ORESoftware/suman.git
## git push publish master -f
#git remote rm public &&
#git checkout dev &&
#git branch -D temp &&
#npm publish .


