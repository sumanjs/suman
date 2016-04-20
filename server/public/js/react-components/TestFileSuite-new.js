define(function (require, exports, module) {/**
 * Created by denmanm1 on 3/30/16.
 */

const React = require('react');
const _ = require('lodash');

module.exports = React.createClass({
    displayName: 'exports',


    findChildren: function findChildren(ids) {
        return this.props.data.filter(function (item) {
            return _.includes(ids, item.testId);
        });
    },

    formatTestCases: function (items) {
        var testCases = items.map(function (tests) {
            return React.createElement(
                'li',
                { className: 'testResults' },
                'Test Description: ',
                React.createElement(
                    'span',
                    { className: 'items' },
                    tests.desc
                ),
                ', Completed: ',
                tests.complete ? React.createElement(
                    'span',
                    { className: 'items', id: 'tick' },
                    '✓'
                ) : React.createElement(
                    'span',
                    { className: 'items', id: 'cross' },
                    '✗'
                ),
                ', Type: ',
                React.createElement(
                    'span',
                    { className: 'items' },
                    tests.type
                ),
                ', Error: ',
                !tests.error ? React.createElement(
                    'span',
                    { className: 'items' },
                    'No Errors'
                ) : React.createElement(
                    'span',
                    { className: 'items', id: 'errors' },
                    tests.error
                ),
                ', Timeout: ',
                React.createElement(
                    'span',
                    { className: 'items' },
                    tests.timeout
                ),
                ', DateStarted: ',
                React.createElement(
                    'span',
                    { className: 'items' },
                    tests.dateStarted
                ),
                ', DateComplete: ',
                React.createElement(
                    'span',
                    { className: 'items' },
                    tests.dateComplete
                )
            );
        }.bind(this));

        return React.createElement(
            'ul',
            null,
            testCases
        );
    },
    testCases: function (item) {
        if (item.length === 0) {
            return React.createElement(
                'div',
                { className: 'no-tests' },
                'Test Cases not defined'
            );
        } else {
            return React.createElement(
                'div',
                null,
                this.formatTestCases(item)
            );
        }
    },

    recurse: function recurse(item) {

        var children = this.findChildren(item.children.map(function (child) {
            return child.testId;
        }));

        return React.createElement(
            'div',
            { className: 'describe' },
            React.createElement(
                'ul',
                null,
                React.createElement(
                    'li',
                    { className: 'descriptionName' },
                    React.createElement(
                        'label',
                        null,
                        'Description:'
                    ),
                    item.desc
                ),
                React.createElement(
                    'div',
                    { className: 'test-cases' },
                    'Test Cases:',
                    this.testCases(item.tests)
                ),
                React.createElement(
                    'div',
                    { className: 'suite-children' },
                    children.map(child => {
                        return this.recurse(child);
                    })
                )
            )
        );
    },

    getDescribes: function () {
        console.log('data:', this.props.data);
        if (this.props.data && this.props.data[0]) {
            return this.recurse(this.props.data[0]);
        } else {
            return React.createElement(
                'div',
                null,
                'Insert spinner here'
            );
        }
    },

    render: function () {
        return React.createElement(
            'div',
            { className: 'accordion-item' },
            this.getDescribes()
        );
    }

});
});
