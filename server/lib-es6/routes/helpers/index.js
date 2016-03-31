/**
 * Created by denman on 12/14/2015.
 */


module.exports = {
    retrieveResults: require('./retrieve-results'),
    serveFavicon : require('./serve-favicon'),
    serveIndex: require('./serve-index'),
    finishResponse: require('./finish-response'),
    serveFile: require('./serve-file'),
    getPathOfMostRecentSubdir: require('./get-path-of-most-recent-subdir'),
    getPathOfOldestSubdir: require('./get-path-of-oldest-subdir'),
    sendBackError: require('./send-back-error')
};