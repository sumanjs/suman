'use strict';

/**
 * Created by denmanm1 on 3/30/16.
 */

var React = require('react');

var TestFileSuite = require('./TestFileSuite');

module.exports = React.createClass({
    displayName: 'exports',


    render: function render() {

        return React.createElement(
            'html',
            { lang: 'en' },
            React.createElement(
                'head',
                null,
                React.createElement('meta', { charset: 'UTF-8' }),
                React.createElement(
                    'title',
                    null,
                    'Title'
                )
            ),
            React.createElement(
                'body',
                null,
                React.createElement(
                    'div',
                    null,
                    React.createElement(TestFileSuite, { items: this.props.items })
                )
            )
        );
    }

});