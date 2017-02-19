#!/usr/bin/env bash


cd  &&   # cd to $HOME
rm -rf suman_project_test_dir &&
mkdir suman_project_test_dir  # might already exist
cd suman_project_test_dir &&
npm init -f &&
SUMAN_POSTINSTALL_IS_DAEMON=no npm install -D --only=production --loglevel=warn \
--progress=false github:oresoftware/suman#dev_integration
