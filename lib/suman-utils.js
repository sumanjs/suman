/**
 * Created by denman on 1/14/2016.
 */



module.exports = {


    getHomeDir: function(){
        return process.env[(process.platform === 'win32' ? 'USERPROFILE' : 'HOME')];
    }


}