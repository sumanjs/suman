#!/usr/bin/env bash

# remove private dirs
git rm -r --ignore-unmatch private bugs examples file-examples internal-docs jsdoc-out node_modules
\ &&

# remove private files
git rm --ignore-unmatch publish-gh-pages.sh pre-publish-gh-pages.sh publish-suman.sh exp*.js jsdoc-notes.txt suman-todos.txt
\ &&

# all done now
echo "All done removing private dirs and files from Suman project"
