#!/usr/bin/env bash


git branch -D master &&
git fetch origin &&
git checkout master &&

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "master" ]]; then
  echo 'Aborting script because you are not on the right git branch (master).';
  exit 1;
fi

echo "done"
