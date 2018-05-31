#!/usr/bin/env bash

#set -e;

#which_istanbul="$(which istanbul)"
#
#if [[ -z "$which_istanbul" ]]; then
#    npm install -g istanbul --silent
#fi
#
#rm -rf node_modules
#npm cache verify # npm cache clean
#
#npm install --loglevel=warn ;
#
#npm link -f;
#npm link suman;


sudo npm install -g typescript@2.8.3
sudo tsc || echo "whatevs"
sudo npm install
sudo npm link -f
sudo npm link suman

