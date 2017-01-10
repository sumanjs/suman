#!/usr/bin/env bash

# running this script assumes you have a sumanjs dir on your system which contains
# suman-utils, suman-debug, suman-events, etc

cd $(dirname "$0")
rm -rf node_modules
npm install
npm link suman-utils -f
npm link suman-debug -f
npm link suman-events -f
npm link suman-example-reporter -f

# finally we link suman
npm link