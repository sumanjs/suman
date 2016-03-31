

const React = require('react');

const AccordionSection = React.createClass({
    displayName: 'AccordionSection',


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
            )
        );
    },

    onSelect: function (e) {
        console.log('event:', e);
        // tell the parent Accordion component that this section was selected
        this.props._onSelect(this.props.id);
    }
});

module.exports = AccordionSection;