/**
 * Created by denman on 2/7/2016.
 */



module.exports = {

    checkForValInStr: function(str, regex){   //used primarily to check if 'done' literal is in fn.toString()
        return ((String(str).match(regex) || []).length > 1);
    }


}