/**
 * Created by denman on 4/27/2016.
 */


module.exports = {

    broadcastOrWrite: function broadcastOrWrite(eventType, value, data) {
        if (global.sumanReporters.length > 0 && global.resultBroadcaster) {
            global.resultBroadcaster.emit(eventType, value, data);
        }
        else{
            const err = new Error('Test condition not met.');
            console.error(err.stack);
            throw err;
        }
    }

}