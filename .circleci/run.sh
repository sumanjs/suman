#!/usr/bin/env bash

npm install -g typescript@2.8.3
tsc || echo "whatevs"
npm install
npm link -f
npm link suman
