/**
 * Created by denman on 3/18/2016.
 */


const _ = require('lodash');
const Immutable = require('immutable');

////////////////////////////////////////////////

const started = [];
const ended = [];

const arrayofVals = [];

module.exports = order => {


    return {

        getStartedAndEnded: function () {
            return {
                started: started,
                ended: ended
            }
        },

        determineInitialStarters: function () {

            Object.keys(order).forEach(function (key) {
                arrayofVals.push({
                    key: key,
                    value: order[key]
                });
            });

            const vals = _.sortBy(arrayofVals, function (item) {
                return item.value.obstructs.length;
            });

            vals.forEach(function (val) {
                if (started.every(function (item) {   //http://stackoverflow.com/questions/6260756/how-to-stop-javascript-foreach
                        if (_.includes(item.value.obstructs, item.key)) {
                            return false;
                        }
                        return true;
                    })) {
                    started.push(val);
                }
            });


            return this;
        },

        shouldFileBeBlockedAtStart: function shouldFileBeBlockedAtStart(file) {

            for (var i = 0; i < started.length; i++) {
                var s = started[i];
                if (String(s.value.testPath) === String(file)) {
                    return true;
                }
            }

            return false;
        }
    }


};