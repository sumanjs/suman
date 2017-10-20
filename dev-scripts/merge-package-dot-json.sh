#!/usr/bin/env bash

set -e;

git checkout dev;
git pull;

git checkout master package.json; # this is the only file we want to merge from master
