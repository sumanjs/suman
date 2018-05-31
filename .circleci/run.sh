#!/usr/bin/env bash

sudo npm install -g typescript@2.8.3
sudo tsc || echo "whatevs"
sudo npm install
sudo npm link -f
sudo npm link suman
