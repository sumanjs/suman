/**
 * Created by denman on 1/2/2016.
 */



module.exports = function handleExtraOpts(desc,opts,cb){

   /* if(typeof desc !== 'string'){
        throw new Error('first argument to this.it() must be a string');
    }

    if(typeof opts === 'function'){
        if(cb){
            throw new Error('too many/too weird arguments');
        }
        cb = opts;
        opts = {};
    }
    else if(typeof opts !== 'object'){
        throw new Error('opts is not an object');
    }
    else if(typeof cb !== 'function'){
        throw new Error('cb is not a function');
    }*/

    if(typeof desc === 'function'){
        if(opts || cb){
            throw new Error('too many/too weird arguments');
        }
        cb = desc;
        desc = '(no description)';
        opts = {};
    }
    else if(typeof opts === 'function'){
        if(cb){
            throw new Error('too many/too weird arguments');
        }
        cb = opts;
        opts = {};
    }
    else if(typeof opts !== 'object'){
        throw new Error('opts is not an object');
    }
    else if(typeof cb !== 'function'){
        throw new Error('cb is not a function');
    }




    return {
        desc:desc,
        opts:opts,
        cb:cb
    }

};