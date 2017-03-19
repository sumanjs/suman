#!/usr/bin/env bash

sqlite3 ${SUMAN_DATABASE_PATH}  "CREATE TABLE suman_run_info (run_id INTEGER, suman_id INTEGER, suite_id INTEGER, test_id INTEGER,
 name TEXT, value TEXT);"
sqlite3 ${SUMAN_DATABASE_PATH}  "CREATE TABLE suman_run_id (id INTEGER UNIQUE, run_id INTEGER);"
sqlite3 ${SUMAN_DATABASE_PATH}  "INSERT INTO suman_run_id VALUES (0,1);"
echo "all done creating tables"
