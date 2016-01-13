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


module.exports = {

    noHost: function (isThrow) {
        return control(isThrow, new Error('no host defined'));
    }


};