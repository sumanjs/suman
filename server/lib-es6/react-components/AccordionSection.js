const React = require('react');
var $ = require('jquery');
const ReactDOM = require('react-dom');


const TestFileSuite = require('./TestFileSuite');


const AccordionSection = React.createClass({

    getInitialState: function () {

        return {
            loaded: false,
            testData: []
        }
    },

    render: function () {

        const className = 'accordion-section' + (this.props._selected ? ' selected' : '');

        // <div className='body'>
        //     {this.props.children}
        // </div>

        return (
            <div className={className}>
                <h3 onClick={this.onSelect}>
                    {this.props.title}
                </h3>

                <div className='body'>
                    <TestFileSuite data={this.state.testData}/>
                </div>
            </div>
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
                url: '/results/' + this.props.runId + '/' + this.props.testId

            }).done((resp) => {

                console.log('resp:',resp);
                this.state.testData = JSON.parse(resp);
                this.forceUpdate();


            }).fail(()=> {

                this.state.testData = 'Bad server response';
                this.forceUpdate();

            });

        }
    }
});


module.exports = AccordionSection;