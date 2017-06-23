#!/usr/bin/env bash

cd $(dirname "$0");
echo "we are running @run.sh"
chmod -R 777 $(pwd)/@target

SUMAN_TARGET="${SUMAN_CHILD_TEST_PATH//@src/@target}"
SUMAN_RUNNABLE=${SUMAN_TARGET%.*}.js

echo "SUMAN_RUNNABLE => ${SUMAN_RUNNABLE}"
echo "node version => $(node -v)"
node ${SUMAN_RUNNABLE} | tee -a run.log

EXIT_CODE=$?;
echo "EXIT_CODE => $EXIT_CODE"
exit ${EXIT_CODE};

#suman $(pwd)/@target/* --inherit-stdio > ./run.log 2>&1
