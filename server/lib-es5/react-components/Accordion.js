'use strict';

/**
 * Created by denmanm1 on 3/30/16.
 */

define(['react'], function (React) {

    var Section = React.createClass({
        displayName: 'Section',

        handleClick: function handleClick(e) {

            console.log('event:', e);

            if (this.state.open) {
                this.setState({
                    open: false,
                    class: "section"
                });
            } else {
                this.setState({
                    open: true,
                    class: "section open"
                });
            }
        },
        getInitialState: function getInitialState() {
            return {
                open: false,
                class: "section"
            };
        },
        render: function render() {
            return React.createElement('div', { className: this.state.class }, React.createElement('button', null, 'toggle'), React.createElement('div', { className: 'sectionhead', onClick: this.handleClick }, this.props.title), React.createElement('div', { className: 'articlewrap' }, React.createElement('div', { className: 'article' }, this.props.children)));
        }
    });

    var Accordion = React.createClass({
        displayName: 'Accordion',

        render: function render() {
            return React.createElement('div', { className: 'main' }, React.createElement('div', { className: 'title' }, this.props.title), React.createElement(Section, { title: 'Section Title One' }, ' Lorem ipsum dolor sit amet, consectetur adipisicing elit. Amet nemo harum voluptas aliquid rem possimus nostrum excepturi!'), React.createElement(Section, { title: 'Section Title Two' }, ' Lorem ipsum dolor sit amet, consectetur adipisicing elit. Amet nemo harum voluptas aliquid rem possimus nostrum excepturi!'), React.createElement(Section, { title: 'Section Title Three' }, ' Lorem ipsum dolor sit amet, consectetur adipisicing elit. Amet nemo harum voluptas aliquid rem possimus nostrum excepturi!'));
        }
    });

    return Accordion;
});