'use strict';

var React = require('react');
var $ = require('jquery');
var ReactDOM = require('react-dom');

var TestFileSuite = require('./TestFileSuite');

var AccordionSection = React.createClass({
    displayName: 'AccordionSection',


    getInitialState: function getInitialState() {

        return {
            loaded: false,
            testData: []
        };
    },

    render: function render() {

        var className = 'accordion-section' + (this.props._selected ? ' selected' : '');

        // <div className='body'>
        //     {this.props.children}
        // </div>

        return React.createElement(
            'div',
            { className: className },
            React.createElement(
                'h3',
                { onClick: this.onSelect },
                this.props.title
            ),
            React.createElement(
                'div',
                { className: 'body' },
                React.createElement(TestFileSuite, { data: this.state.testData })
            )
        );
    },

    onSelect: function onSelect(e) {
        var _this = this;

        console.log('event:', e);
        // tell the parent Accordion component that this section was selected
        this.props._onSelect(this.props.id);

        if (!this.state.loaded) {
            this.state.loaded = true;

            $.ajax({
                type: 'GET',
                url: '/results/' + this.props.runId + '/' + this.props.testId

            }).done(function (resp) {

                console.log('resp:', resp);
                _this.state.testData = JSON.parse(resp);
                _this.forceUpdate();
            }).fail(function () {

                _this.state.testData = 'Bad server response';
                _this.forceUpdate();
            });
        }
    }
});

module.exports = AccordionSection;