#!/usr/bin/env bash

# remove dirs
git rm -r --ignore-unmatch private bugs examples file-examples internal-docs jsdoc-out node_modules

# remove files
git rm --ignore-unmatch publish-gh-pages.sh pre-publish-gh-pages.sh publish-suman.sh exp*.js jsdoc-notes.txt suman-todos.txt

# all done
echo "All done here"