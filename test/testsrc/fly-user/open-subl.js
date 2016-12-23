#!/usr/bin/env node


const cp = require('child_process');
const path = require('path');
const dir = path.resolve(process.env.HOME + '/suman-test/suman-test-projects/subprojects');

cp.spawn('subl', [dir], {
    detached: true
});
