#!/usr/bin/env bash

cd ${HOME} &&
echo ${PWD} &&
mkdir project &&
cd project &&
npm init -f &&
echo ".....Installing suman with 'npm install -D --silent github:oresoftware/suman'...." &&
npm install -D --silent github:oresoftware/suman &&
echo "...Making test directory..." &&
mkdir test &&
echo $(ls -a) &&
echo "....initing suman..." &&
SUMAN_DEBUG=s ./node_modules/.bin/suman --init &&
echo "....DONE initing suman..." &&
echo $(ls -a) &&
echo "....creating new test file..." &&
SUMAN_DEBUG=s ./node_modules/.bin/suman --create test/one.test.js &&
echo "....executing suman test runner..." &&
SUMAN_DEBUG=s  ./node_modules/.bin/suman &&
echo "all done here!"
