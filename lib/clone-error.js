'use strict';



//project
const _suman = global.__suman = (global.__suman || {});


//////////////////////////////////////////////////////////////////////////////

module.exports = function manuallyCloneError(err, newMessage, stripAllButTestFilePathMatch) {

    const obj = {};
    obj.message = newMessage;
    let temp = err.stack.split('\n');
    if (stripAllButTestFilePathMatch) {
        temp = temp.filter(function (line, index) {
            if (index === 0) {
                return true;
            }
            else {
                return String(line).match(new RegExp(global.sumanTestFile));
            }
        });
    }
    temp[0] = newMessage;
    temp = temp.map(function (item) {
        // return '\t' + item;
        return item;
    });
    obj.stack = temp.join('\n');
    return obj;

};
