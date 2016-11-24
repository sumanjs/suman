#!/usr/bin/env bash

cd # cd to home dir
mkdir suman-test
cd suman-test &&
rm -rf suman-test-projects &&
#git clone git@github.com:sumanjs/suman-test-projects.git &&
git clone https://github.com/sumanjs/suman-test-projects.git &&
cd suman-test-projects &&
./test-all.sh &&

echo "bash exit code => $?" &&
exit "$?"