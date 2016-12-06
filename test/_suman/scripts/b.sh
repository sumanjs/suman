#!/usr/bin/env bash

cd  &&  # cd to $HOME
echo ${PWD} &&
rm -rf suman_project_test_dir &&
mkdir suman_project_test_dir  # might already exist
cd suman_project_test_dir &&
npm init -f &&
echo ".....Installing suman with 'npm install -D --silent github:oresoftware/suman#dev'...." &&
SUMAN_POSTINSTALL_IS_DAEMON=yes npm install -D --silent --progress=false github:oresoftware/suman#dev &&
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
