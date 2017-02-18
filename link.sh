#!/usr/bin/env bash

# running this script assumes you have a sumanjs dir on your system which contains
# suman-utils, suman-debug, suman-events, etc

cd $(dirname "$0")
rm -rf node_modules
npm install

# link dev deps
npm link suman-utils -f
npm link suman-debug -f
npm link suman-events -f
npm link suman-example-reporter -f

# link peer deps
npm link suman-server -f
npm link suman-inquirer -f
npm link suman-inquirer-directory -f 

# finally we link suman
npm link .
npm link suman