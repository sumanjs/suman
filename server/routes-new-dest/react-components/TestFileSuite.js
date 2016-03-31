/**
 * Created by amills001c on 3/30/16.
 */

const React = require('react');
const _ = require('lodash');

var data = JSON.parse('[{"testId":0,"desc":"A describe","children":[{"testId":1},{"testId":2},{"' + 'testId":3},{"testId":4}],"tests":[{"parallel":false,"testId":5,"data":{},"type":"' + 'it-standard","timeout":5000,"desc":"a test","timedOut":false,"complete":true,"error":null' + ',"dateStarted":574,"dateComplete":578}]},{"testId":1,"desc":"B describe","children":[{"testId":10' + '}],"tests":[{"parallel":false,"testId":6,"data":{},"type":"it-standard","timeout":5000,"' + 'desc":"b1 test","timedOut":false,"complete":true,"error":null,"dateStarted":580,"dateComple' + 'te":581},{"testId":7,"data":{},"type":"it-standard","timeout":5000,"desc":"b2 test","timedO' + 'ut":false,"complete":true,"error":null,"dateStarted":581,"dateComplete":581},{"testId":8,"d' + 'ata":{},"type":"it-standard","timeout":5000,"desc":"b3 test","timedOut":false,"complete":tr' + 'ue,"error":null,"dateStarted":581,"dateComplete":581},{"testId":9,"data":{},"type":"it-sta' + 'ndard","timeout":5000,"desc":"b4 test","timedOut":false,"complete":true,"error":null,"date' + 'Started":581,"dateComplete":581}]},{"testId":2,"desc":"D describe","children":[{"testId":' + '13}],"tests":[{"testId":11,"data":{},"type":"it-standard","timeout":5000,"desc":"d1 test","ti' + 'medOut":false,"complete":true,"error":null,"dateStarted":582,"dateComplete":582},{"testId":1' + '2,"data":{},"type":"it-standard","timeout":5000,"desc":"d2 test","timedOut":false,"compl' + 'ete":true,"error":null,"dateStarted":582,"dateComplete":582}]},{"testId":3,"desc":"F","ch' + 'ildren":[{"testId":17}],"tests":[]},{"testId":4,"desc":"moodle","children":[],"tests":[{"' + 'parallel":false,"testId":19,"data":{},"type":"it-standard","timeout":5000,"desc":"mmm1","tim' + 'edOut":false,"complete":true,"error":null,"dateStarted":582,"dateComplete":582}]},{"testId":1' + '0,"desc":"C","children":[],"tests":[]},{"testId":13,"desc":"E","children":[],"tests":[{"testId":1' + '4,"data":{},"type":"it-standard","timeout":5000,"desc":"e1 test","timedOut":false,"complet' + 'e":true,"error":null,"dateStarted":584,"dateComplete":584},{"testId":15,"data":{},"typ' + 'e":"it-standard","timeout":5000,"desc":"e2 test","timedOut":false,"complete":true,"err' + 'or":null,"dateStarted":584,"dateComplete":584},{"testId":16,"data":{},"type":"it-stan' + 'dard","timeout":5000,"desc":"e3 test","timedOut":false,"complete":true,"error":null,"date' + 'Started":584,"dateComplete":584}]},{"testId":17,"desc":"G","children":[],"tests":[{"para' + 'llel":false,"testId":18,"data":{},"type":"it-standard","ti' + 'meout":5000,"desc":"mmm2","timedOut":false,"complete":true,"error":null,"dateStarted":585,"d' + 'ateComplete":585}]}]');

function getTestCases() {}

function findChildren(ids) {
    var children = data.filter(function (item) {
        return _.includes(ids, item.testId);
    });

    return children;
}

function doStuff(childIds) {

    var mapped = findChildren(childIds).map(function (child) {
        return String(recurse(child));
    });

    return mapped;
}

var styles = {

    describe: {
        'margin-left': '30px',
        padding: 10, // Becomes "10px" when rendered.
        color: "#333"
    }

};

function recurse(item) {

    var children = findChildren(item.children.map(function (child) {
        return child.testId;
    }));

    return React.createElement(
        'div',
        { className: 'describe' },
        item.desc,
        React.createElement(
            'div',
            { className: 'test-cases' },
            'Test Cases:',
            JSON.stringify(item.tests)
        ),
        React.createElement(
            'div',
            { className: 'suite-children' },
            item.children.length > 0 ? 'Children of ' + item.desc : '(no children)',
            children.map(function (child) {
                return recurse(child);
            })
        )
    );
}

module.exports = React.createClass({
    displayName: 'exports',


    getDescribes: function () {

        return recurse(data[0]);
    },

    render: function () {
        return React.createElement(
            'div',
            { className: 'accordion-item' },
            this.getDescribes()
        );
    }

});