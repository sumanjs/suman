/**
 * Created by Olegzandr on 5/12/16.
 */


const freezeExistingProps = require('./freeze-existing');


const proto = {

    wrap: function wrap(fn) {
        const self = this;
        return function () {
            try {
                fn.apply(this, arguments);
            } catch (e) {
                self.__handle(e, false);
            }
        }
    },

    log: function log() {  //TODO: update this
        global._writeLog.apply(null, arguments);
    },

    slow: function slow() {

    }

};



module.exports = freezeExistingProps(proto);


