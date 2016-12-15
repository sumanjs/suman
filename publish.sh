#!/usr/bin/env bash

# usage:
# GIT_COMMIT_MSG = $1  =>  first argument to script
# if second argument to script $2 is "publish"  then we publish to NPM

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "dev" ]]; then
  echo 'Aborting script because you are not on the right git branch (dev).';
  exit 1;
fi

REMOTE_STAGING_BRANCH_EXISTS=$(git ls-remote --heads git@github.com:oresoftware/suman.git staging)
REMOTE_STAGING_BRANCH_EXISTS="$(echo -e "${REMOTE_STAGING_BRANCH_EXISTS}" | tr -d '[:space:]')"

if [[ ! -z ${REMOTE_STAGING_BRANCH_EXISTS} ]]; then
echo "REMOTE_STAGING_BRANCH_EXISTS => '$REMOTE_STAGING_BRANCH_EXISTS'"
echo "You must delete the remote staging branch before continuing, or wait for the PR to complete, and delete it" &&
exit 1;
fi


if [ "$2" = "publish" ]; then
   npm version patch --force -m "Upgrade for several reasons" &&    # bump version
   echo "bumped version"
else
  echo "note that we are *not* publishing to NPM"
fi

MILLIS_SINCE_EPOCH=$(date +%s%N | cut -b1-13)
GIT_COMMIT_MSG=${1:-"${MILLIS_SINCE_EPOCH}"} &&

git add . &&
git add -A &&
git commit --allow-empty -am "pre:$GIT_COMMIT_MSG" &&
git pull &&
git add . &&
git add -A &&
git commit --allow-empty -am "pub/rel:$GIT_COMMIT_MSG" &&
git push &&                     # push to private/dev remote repo
git checkout -b dev_temp &&
SHA=$(git merge-base dev_temp dev_rebase) # get the common ancestor of the two branches

if [ -z "$SHA" ]; then
 echo "SHA was empty, something is wrong"
 exit 1;
fi

git branch -D dev_rebase &&
git checkout -b dev_rebase &&
git rebase ${SHA} &&

git add . &&
git add -A &&
git commit --allow-empty -am "pub/rel:$GIT_COMMIT_MSG" &&
git checkout -b temp  &&                 # we checkout this branch to run deletes on private files

./delete-internal-paths.sh &&
git rm delete-internal-paths.sh -f &&
git add . &&
git add -A &&
git commit --allow-empty -am "pub/rel:$GIT_COMMIT_MSG" &&

(./test/testsrc/shell/node-c.sh && echo "compiled successfully") ||
 (echo "after deleting files, we could not compile with node-c " && git checkout dev -f && git branch -D temp; exit 1) &&
git push origin HEAD:staging ||
(echo "could not push to staging branch, you should manually merge temp branch with origin/staging" && exit 1)

if [ "$2" = "publish" ]; then
   npm publish .  &&    # bump version
   echo "published suman to NPM"
fi

git checkout dev &&
git branch -D temp



