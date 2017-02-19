#!/usr/bin/env bash


if [[ ! -z $1 ]]; then
  export SUMAN_TEST_NAME="$1"
fi

MY_DIR=$(cd $(dirname "$0") && pwd)

echo "NODE_PATH => ${NODE_PATH}"
cd # cd to home dir
mkdir suman-test
cd suman-test &&
rm -rf suman-test-projects &&
git clone --depth 1 https://github.com/sumanjs/suman-test-projects.git &&
cd suman-test-projects &&
git checkout master &&

if [[ -z ${DO_NOT_RUN} ]]; then
./test/test-all.sh
fi
# npm test > output.log 2>&1 &&

EXIT=$?
echo " => bash exit code for script '$(dirname "$0")/$(basename "$0")' => $EXIT" && exec ${MY_DIR}/open-subl.js
exit ${EXIT}

