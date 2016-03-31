


const React = require('react');


const AccordionSection = React.createClass({

    render: function () {
        
        const className = 'accordion-section' + (this.props._selected ? ' selected' : '');

        return (
            <div className={className}>
                <h3 onClick={this.onSelect}>
                    {this.props.title}
                </h3>
                <div className='body'>
                    {this.props.children}
                </div>
            </div>
        );
    },

    onSelect: function (e) {
        console.log('event:',e);
        // tell the parent Accordion component that this section was selected
        this.props._onSelect(this.props.id);
    }
});



module.exports = AccordionSection;