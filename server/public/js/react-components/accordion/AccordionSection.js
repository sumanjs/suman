define(function (require, exports, module) {const React = require('react');
var $ = require('jquery');
const ReactDOM = require('react-dom');

const TestFileSuite = require('../TestFileSuite');

const AccordionSection = React.createClass({
    displayName: 'AccordionSection',


    getInitialState: function () {

        return {
            loaded: false,
            runId: '1459464754546',
            testId: 'test4',
            testData: []
        };
    },

    render: function () {

        const className = 'accordion-section' + (this.props._selected ? ' selected' : '');

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
                this.props.children
            ),
            React.createElement(
                'div',
                { className: 'body' },
                React.createElement(TestFileSuite, { data: this.state.testData })
            ),
            '(bottom)'
        );
    },

    onSelect: function (e) {
        console.log('event:', e);
        // tell the parent Accordion component that this section was selected
        this.props._onSelect(this.props.id);

        if (!this.state.loaded) {
            this.state.loaded = true;

            $.ajax({
                type: 'GET',
                url: '/results/' + this.state.runId + '/' + this.state.testId

            }).done(resp => {

                console.log('resp:', resp);
                this.state.testData = JSON.parse(resp);
                this.forceUpdate();
            }).fail(() => {

                this.state.testData = 'Bad server response';
                this.forceUpdate();
            });
        }
    }
});

module.exports = AccordionSection;
});
