/**
 * Created by denman on 3/16/2016.
 */


const parseFunction = require('parse-function');

module.exports = function acquireDependencies(depList, depContainerObj, cb) {

    var obj = {};

    depList.forEach(dep => {
        obj[dep] = depContainerObj[dep]; //copy only the subset
        if(obj[dep] == null){
            throw new Error(' => Suman fatal error => no integrant with name = "' + dep + '" was found in your suman.once.js file.');
        }

        if(typeof obj[dep] !== 'function'){
            try{
                obj[dep] = JSON.stringify(obj[dep]);
            }
            catch(err){
                 //do nothing
            }
            throw new Error(' => Suman fatal error => integrant entity with name = "' + dep + '" was not found to be a function => ' + String(obj[dep]));
        }
    });

    var temp = [];

    Object.keys(obj).forEach(function (key) {
        temp.push(obj[key]);
    });

    temp = temp.map(function (fn) {

        return new Promise(function (resolve, reject) {

            if (!fn || typeof fn !== 'function') {
                process.nextTick(function () {
                    console.log(' => Suman warning: would-be function was undefined.');
                    resolve(null);
                });
            }
            else if (fn.length > 0) {
                var args = parseFunction(fn).args;
                var str = fn.toString();
                var matches = str.match(new RegExp(args[0], 'g')) || [];
                if (matches.length < 2) { //there should be at least two instances of the 'cb' string in the function, one in the parameters array, the other in the fn body.
                    throw new Error(' => Suman error => Callback in your function was not present => ' + str);
                }
                fn.apply(global, [function (err, val) { //TODO what to use for ctx of this .apply call?
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(val);
                    }
                }]);
            }
            else {
                Promise.resolve(fn.apply(global, [])).then(function (val) {
                    resolve(val);
                }).catch(function (err) {
                    reject(err);
                });
            }

        });

    });

    Promise.all(temp).then(function (deps) {
        Object.keys(obj).forEach(function (key, index) {
            obj[key] = deps[index];
        });
        cb(null, obj);

    }).catch(function (err) {
        err = new Error(' => Suman fatal error => Suman had a problem verifying your integrants in your suman.once.js file. => \n' + err.stack);
        cb(err, {});
    });
}