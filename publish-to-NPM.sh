#!/usr/bin/env bash


BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" == "master" ]]; then
  echo 'Aborting script because you are not on the right git branch.';
  exit 1;
fi

git fetch origin &&
git checkout master &&
git pull &&
npm version patch -f &&
git add . &&
git add -A &&
git commit -am "Patched NPM version" &&
 ./test/testsrc/shell/node-c.sh  || { echo " Did not compile successfully "; exit 1; } &&
git push &&
npm publish . &&
git checkout ${BRANCH} &&
echo "Suman was published successfully"
