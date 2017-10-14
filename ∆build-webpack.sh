#!/usr/bin/env bash

cd $HOME/WebstormProjects/oresoftware/

npm init -f
npm install -S babel-runtime
npm install -S babel-core
npm install -S babel-plugin-transform-runtime
npm install -S babel-preset-es2015
npm install -S babel-preset-es2016
npm install -S babel-polyfill
npm install -S babel-preset-stage-0
npm install -S babel-preset-stage-1
npm install -S babel-preset-stage-2
npm install -S babel-preset-stage-3
npm install -S babel-preset-latest

#[ ! -d "node_modules/babel-runtime" ] && npm install babel-runtime
#[ ! -d "node_modules/babel-core" ] && npm install babel-core
#[ ! -d "node_modules/babel-plugin-transform-runtime" ] && npm install babel-plugin-transform-runtime
#[ ! -d "node_modules/babel-plugin-transform-runtime" ] && npm install babel-plugin-transform-runtime
#[ ! -d "node_modules/babel-preset-es2015" ] && npm install babel-preset-es2015
#[ ! -d "node_modules/babel-preset-es2016" ] && npm install babel-preset-es2016
#[ ! -d "node_modules/babel-polyfill" ] && npm install babel-polyfill
#[ ! -d "node_modules/babel-preset-stage-0" ] && npm install babel-preset-stage-0
#[ ! -d "node_modules/babel-preset-stage-1" ] && npm install babel-preset-stage-1
#[ ! -d "node_modules/babel-preset-stage-2" ] && npm install babel-preset-stage-2
#[ ! -d "node_modules/babel-preset-stage-3" ] &&  npm install babel-preset-stage-3

cd $(dirname "$0") && NODE_PATH="${NODE_PATH}":"$HOME/.suman/global/node_modules" webpack
