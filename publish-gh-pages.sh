#!/usr/bin/env bash


git remote add publish git@github.com:ORESoftware/suman.git
git checkout -b gh-pages
git subtree push --prefix public/jsdoc-out publish gh-pages
git checkout dev
git branch -d gh-pages
git remote rm publish