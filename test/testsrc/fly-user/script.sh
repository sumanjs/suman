#!/usr/bin/env bash


echo "NODE_PATH => ${NODE_PATH}"
cd # cd to home dir
mkdir suman-test
cd suman-test &&
rm -rf suman-test-projects &&
#git clone git@github.com:sumanjs/suman-test-projects.git &&
git clone https://github.com/sumanjs/suman-test-projects.git &&
cd suman-test-projects &&
npm test &&
# npm test > output.log 2>&1 &&

EXIT=$?
echo "bash exit code => $?" &&
exit ${EXIT}
