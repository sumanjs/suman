#!/usr/bin/env bash

cd ${HOME} &&
echo ${PWD} &&
mkdir project &&
cd project &&
npm init -f &&
npm install -D --silent github:oresoftware/suman &&
mkdir test &&
./node_modules/.bin/suman --init &&
./node_modules/.bin/suman --create test/one.test.js &&
./node_modules/.bin/suman &&
echo "fish and human being"
