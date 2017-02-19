#!/usr/bin/env bash

cd # cd to home dir
mkdir suman-test
cd suman-test &&
git clone --depth 1 https://github.com/ORESoftware/suman &&
cd suman &&
npm install &&
npm test

