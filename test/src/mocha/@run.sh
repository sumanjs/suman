#!/usr/bin/env bash

echo "bash pid => $$";
echo "processor affinity before => $(taskset -p $$)"
taskset -cp ${SUMAN_CHILD_ID} $$
echo "processor affinity after => $(taskset -p $$)"
echo "SUMAN_CHILD_TEST_PATH => $SUMAN_CHILD_TEST_PATH"
mocha "${SUMAN_CHILD_TEST_PATH}" --reporter mocha-tap-reporter
