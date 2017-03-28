#!/usr/bin/env bash

MY_DIR=$(dirname "$0")

mkdir -p ${MY_DIR}/target
go build -o ${MY_DIR}/target/go.suman ${MY_DIR}/src/*.go
