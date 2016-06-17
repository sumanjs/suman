#!/usr/bin/env bash
git checkout -b master
npm run remove-private-dirs
npm run remove-private-files
git add .
git add -A
git commit -am "publish/release"
git push origin master -f
git checkout dev
git branch -D master
