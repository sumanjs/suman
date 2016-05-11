#!/bin/bash

SUMAN=suman
SUMAN_DEBUG=suman-debug
ISTANBUL=node_modules/.bin/istanbul
COVERALLS=node_modules/coveralls/bin/coveralls.js

# test files must start with "test*.js"

TESTS=$(shell find test/ -name "*.test.js" -not -path "*service/*")

SERVICETEST=$(shell find test/service/ -name "test*.js" )

test:
	$(SUMAN) -r $(TESTS)
test-service:
	$(MOCHA) -R spec $(SERVICETEST)
test-debug:
	$(SUMAN_DEBUG) -r $(TESTS)
test-coverage:
	# Remove libcov if exits
	rm -rf lib-cov/
	rm -rf html-report/
	$(ISTANBUL) instrument lib/ -o lib-cov/
	TODO_COV=1 ISTANBUL_REPORTERS=lcov,text-summary,html $(MOCHA) --reporter mocha-istanbul $(TESTS)
test-coveralls:
	echo TRAVIS_JOB_ID $(TRAVIS_JOB_ID)
	cat lcov.info | $(COVERALLS)

.PHONY: coverage clean test test-debug test-coverage test-coveralls