/**
 * Created by denman on 2/7/2016.
 */


var path = require('path');
var fs = require('fs');

module.exports = {

    checkForValInStr: function (str, regex) {   //used primarily to check if 'done' literal is in fn.toString()
        return ((String(str).match(regex) || []).length > 1);
    },

    findProjectRoot: function findRoot(pth) {

        var possibleNode_ModulesPath = path.resolve(path.normalize(String(pth) + '/package.json'));

        try {
            fs.statSync(possibleNode_ModulesPath).isFile();
            return pth;
        }
        catch (err) {
            var subPath = path.resolve(path.normalize(String(pth) + '/../'));
            if (subPath === pth) {
                return null;
            }
            else {
                return findRoot(subPath);
            }
        }

    }

}