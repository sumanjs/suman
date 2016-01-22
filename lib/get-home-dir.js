/**
 * Created by amills001c on 1/22/16.
 */



module.exports = function getHomeDir(){

    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

};