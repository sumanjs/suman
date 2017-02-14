#!/usr/bin/env bash

############################################################

MY_DIR=$(cd $(dirname "$0") && pwd)
docker stop $(docker ps -a -q) -t 1 # stop all running containers

export USE_DOCKER=yes
export SUMAN_DEBUG=s
echo "NODE_PATH => $NODE_PATH"
cd # cd to home dir
mkdir suman-test
cd suman-test &&
rm -rf suman-test-projects &&
git clone https://github.com/sumanjs/suman-test-projects.git &&
cd suman-test-projects &&
#git checkout -b test_branch &&
echo "installing suman deps locally"
SUMAN_POSTINSTALL_IS_DAEMON=yes npm install --progress=false --loglevel=warn &>/dev/null &&
echo "args => $@"
suman --concurrency=9 --groups $@

EXIT=$?
echo " => bash exit code for script '$(dirname "$0")/$(basename "$0")' => $EXIT" &&
#exec ${MY_DIR}/open-subl.js  -> can't see logs because they are in container
exit ${EXIT}
