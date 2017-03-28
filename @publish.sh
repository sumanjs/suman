#!/usr/bin/env bash


BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" == "master" ]]; then
  echo 'Aborting script because you are not on the right git branch.';
  exit 1;
fi

git add . &&
git add -A &&
git commit -am "temp before NPM Publish" &&
git fetch origin &&
git checkout master &&
git pull -f  || echo ""
npm version patch -f &&
git add . &&
git add -A &&
git commit -am "Patched NPM version" &&
 { ./test/src/shell/node-c.sh && echo " success "; }  || { echo " Did not compile successfully "; exit 1; } &&

./node_modules/.bin/ncf --rt $(dirname "$0") --np=**/test/** --np=**/node_modules/** --v 3 --c=8
git push &&
npm publish . &&
git checkout ${BRANCH} &&
echo "Suman was published successfully"
