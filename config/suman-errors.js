/**
 * Created by amills001c on 1/12/16.
 */



function SumanError() {

}

SumanError.prototype = Object.create(Error.prototype);
SumanError.prototype.constructor = SumanError;


function control(isThrow, err) {
    if (isThrow) {
        throw err;
    }
    else {
        return err;
    }
}

function filter(suman, isFatal, err) {

    var stack = String(err.stack).split('\n');

    var firstMatch = false;

    stack = stack.map(function (item, index) {
        if (index === 0) {
            return item;
        }
        //TODO: need to make this work with Windows also
        if (item) {
            //if (String(item).match(/at TestSuite/) && !String(item).match(/suman\/lib/)) {
            //    return item;
            //}
            if (!firstMatch && String(item).match(suman.fileName) /*|| !String(item).match(/suman\/lib/)*/) {
                firstMatch = true;
                return item;
            }
        }
    }).filter(function(item){
        return item;
    }).join('\n').concat('\n');

    var msg = isFatal ? 'FATAL' : 'NON_FATAL_ERR';

    if (process.send) {
        process.send({msg: stack, type: msg, fatal: isFatal});
    }
    else {
        process.stdout.write(stack);
    }

    if (isFatal) {
        console.error(new Error('Fatal error').stack);
        process.exit(1);
    }

}


module.exports = {

    noHost: function (isThrow) {
        return control(isThrow, new Error('no host defined'));
    },

    noPort: function (isThrow) {
        return control(isThrow, new Error('no port defined'));
    },

    badArgs: function (suman, isFatal, err) {
        return filter(suman, isFatal, err);
    }


};