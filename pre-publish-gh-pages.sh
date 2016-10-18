#!/usr/bin/env bash


jsdoc examples -u examples -d jsdoc-out
mv jsdoc-out/ public/
# copy images into jsdoc