#!/usr/bin/env bash


BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" == "master" ]]; then
  echo 'Aborting script because you are not on the right git branch.';
  exit 1;
fi

git fetch origin &&
git checkout master &&
git diff --exit-code &&
git diff --cached --exit-code &&


echo "done"
