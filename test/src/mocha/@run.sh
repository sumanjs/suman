#!/usr/bin/env bash

echo "bash pid => $$";
echo "processor affinity => $(taskset -p $$)"
echo "SUMAN_CHILD_TEST_PATH => $SUMAN_CHILD_TEST_PATH"
mocha "${SUMAN_CHILD_TEST_PATH}" --reporter mocha-tap-reporter
