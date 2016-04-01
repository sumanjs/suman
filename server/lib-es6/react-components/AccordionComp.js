const React = require('react');


const Accordion = React.createClass({

    getInitialState: function () {
        // we should also listen for property changes and reset the state
        // but we aren't for this demo
        return {
            // initialize state with the selected section if provided
            selected: this.props.selected
        };
    },

    render: function () {

        // enhance the section contents so we can track clicks and show sections
        const children = React.Children.map(this.props.children, this.enhanceSection);

        return (
            <div className='accordion'>
                {children}
            </div>
        );
    },

    // return a cloned Section object with click tracking and 'active' awareness
    enhanceSection: function (child) {

        const selectedId = this.state.selected;
        const id = child.props.id;

        return React.cloneElement(child, {
            key: id,
            // private attributes/methods that the Section component works with
            _selected: id === selectedId,
            _onSelect: this.onSelect
        });
    },

    // when this section is selected, inform the parent Accordion component
    onSelect: function (id) {
        this.setState({selected: id});
    }
});


module.exports = Accordion;


