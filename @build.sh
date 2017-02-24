#!/usr/bin/env bash

# this file is used by "clone-all-org-repos" project

cd $(dirname "$0") &&
rm -rf node_modules &&
npm install &&
echo "suman built successfully"

# you may wish to run the ./link.sh script as well
# but that should be done manually as desired
