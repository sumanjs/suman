#!/usr/bin/env bash


echo $1

echo "${@:1}"

echo "${@:2}"

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "master" ]]; then
  echo 'Aborting script because you are not on the right git branch.';
  exit 1;
fi

echo 'Do stuff';