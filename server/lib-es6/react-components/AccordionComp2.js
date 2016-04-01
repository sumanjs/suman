
const React = require('react');


const Section = require('./AccordionSection2');

var Accordion = React.createClass({
    render: function () {
        return (
            <div className="main">
                <div className="title">{this.props.title}</div>
                <Section title="Section Title One"> Lorem ipsum dolor sit amet, consectetur adipisicing elit. Amet nemo
                    harum voluptas aliquid rem possimus nostrum excepturi!
                </Section>
                <Section title="Section Title Two"> Lorem ipsum dolor sit amet, consectetur adipisicing elit. Amet nemo
                    harum voluptas aliquid rem possimus nostrum excepturi!
                </Section>
                <Section title="Section Title Three"> Lorem ipsum dolor sit amet, consectetur adipisicing elit. Amet
                    nemo harum voluptas aliquid rem possimus nostrum excepturi!
                </Section>
            </div>
        );
    }
});

module.exports = Accordion;
