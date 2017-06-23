#!/usr/bin/env bash

echo "we are running @transform.sh"
cd $(dirname "$0");
chmod 777 -R $(pwd)/@target
tsc $(pwd)/@src/*.ts --outDir $(pwd)/@target
chmod 777 -R $(pwd)/@target
