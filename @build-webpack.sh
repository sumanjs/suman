#!/usr/bin/env bash

cd $(dirname "$0")
[ ! -d "node_modules/babel-plugin-transform-runtime" ] && npm install babel-plugin-transform-runtime
[ ! -d "node_modules/babel-preset-es2015" ] && npm install babel-preset-es2015
[ ! -d "node_modules/babel-preset-es2016" ] && npm install babel-preset-es2016
[ ! -d "node_modules/babel-polyfill" ] && npm install babel-polyfill
[ ! -d "node_modules/babel-preset-stage-0" ] && npm install babel-preset-stage-0
[ ! -d "node_modules/babel-preset-stage-1" ] && npm install babel-preset-stage-1
[ ! -d "node_modules/babel-preset-stage-2" ] && npm install babel-preset-stage-2
[ ! -d "node_modules/babel-preset-stage-3" ] &&  npm install babel-preset-stage-3


NODE_PATH=${NODE_PATH}:~/.suman/global/node_modules webpack
