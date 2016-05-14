'use strict';

var React = require('react');

var Accordion = React.createClass({
    displayName: 'Accordion',


    getInitialState: function getInitialState() {
        // we should also listen for property changes and reset the state
        // but we aren't for this demo
        return {
            // initialize state with the selected section if provided
            selected: this.props.selected
        };
    },

    render: function render() {

        // enhance the section contents so we can track clicks and show sections
        var children = React.Children.map(this.props.children, this.enhanceSection);

        return React.createElement(
            'div',
            { className: 'accordion' },
            children
        );
    },

    // return a cloned Section object with click tracking and 'active' awareness
    enhanceSection: function enhanceSection(child) {

        var selectedId = this.state.selected;
        var id = child.props.id;

        return React.cloneElement(child, {
            key: id,
            // private attributes/methods that the Section component works with
            _selected: id === selectedId,
            _onSelect: this.onSelect
        });
    },

    // when this section is selected, inform the parent Accordion component
    onSelect: function onSelect(id) {
        this.setState({ selected: id });
    }
});

module.exports = Accordion;