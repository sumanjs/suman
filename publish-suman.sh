#!/usr/bin/env bash

# usage:
# GIT_COMMIT_MSG = $1  =>  first argument to script
# if second argument to script $2 is "publish"  then we publish to NPM



BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "dev" ]]; then
  echo 'Aborting script because you are not on the right git branch (dev).';
  exit 1;
fi

if [ "$2" = "publish" ]; then
   npm version patch --force -m "Upgrade for several reasons" &&    # bump version
   echo "bumped version"
else
  echo "note that we are *not* publishing to NPM"
fi


git add . &&
git add -A &&
git commit --allow-empty -am "publish/release:$1" &&
git push &&                     # push to private/dev remote repo
git checkout -b dev_squash_temp dev_squash &&
git merge --squash -Xtheirs dev -m "squashing" &&  # make sure the merge succeeds before actually doing it...
git checkout dev_squash -f &&    # we do squashing on this branch
git branch -D dev_squash_temp &&
git merge --squash -Xtheirs dev -m "squashing" &&
git add . &&
git add -A &&
git commit --allow-empty -am "publish/release:$1" &&
git checkout -b temp  &&                                          # we checkout this branch to run deletes on private files
./delete-internal-paths.sh &&
git rm delete-internal-paths.sh -f &&
git add . &&
git add -A &&
git commit --allow-empty -am "publish/release:$1" &&
#git rebase $(git describe --tags) &&
git push origin HEAD:staging -f &&


if [ "$2" = "publish" ]; then
   npm publish .  &&    # bump version
   echo "published suman to NPM"
fi

git checkout dev &&
git branch -D temp



