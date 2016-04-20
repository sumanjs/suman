/**
 * Created by denmanm1 on 3/30/16.
 */


const React = require('react');
const _ = require('lodash');


module.exports = React.createClass({


    findChildren: function findChildren(ids) {
        return this.props.data.filter(function (item) {
            return _.includes(ids, item.testId);
        });

    },

    formatTestCases: function(items){
        var testCases = items.map(function(tests){
            return(
                <li className="testResults">

                    Test Description: <span className="items">{tests.desc}</span>,
                    Completed: {tests.complete ? <span className="items" id="tick">&#x2713;</span> :
                    <span className="items" id="cross">&#x2717;</span>},
                    Type: <span className="items">{tests.type}</span>,
                    Test error: {!tests.error ? <span className="items">(null)</span> :
                    <span className="items" id="errors">{tests.error}</span>},
                    Timeout: <span className="items">{tests.timeout}</span>,
                    DateStarted: <span className="items">{tests.dateStarted}</span>,
                    DateComplete: <span className="items">{tests.dateComplete}</span>
                    Total time: <span className="items">{tests.dateComplete - tests.dateStarted}</span>

                </li>
            );
        }.bind(this));

        return(
            <ul>
                {testCases}
            </ul>
        );

    },
    testCases: function(item){
        if(item.length === 0){
            return(
                <div className="no-tests">
                    Test Cases not defined
                </div>
            );
        }else{
            return(
                <div>
                    {this.formatTestCases(item)}
                </div>
            );
        }
    },

    recurse: function recurse(item) {

        var children = this.findChildren(item.children.map(function (child) {
            return child.testId;
        }));

        return (

            <div className="describe">
                <ul>
                    <li className="descriptionName">
                        <label>Description: '{item.desc}', options: {JSON.stringify(item.opts)}</label>
                    </li>
                    {item.tests.length > 0 ? <div className="test-cases">
                        Test Cases:
                        {this.testCases(item.tests)}
                    </div> : null}

                    <div className="suite-children">
                        {children.map((child) => {
                            return this.recurse(child);
                        })}
                    </div>
                </ul>
            </div>

        )

    },


    getDescribes: function () {
        console.log('data:',this.props.data);
        if(this.props.data && this.props.data[0]) {
            return this.recurse(this.props.data[0]);
        }
        else{
            return (
                <div>
                    Insert spinner here
                </div>
            )
        }
    },

    render: function () {
        return (
            <div className="accordion-item">
                {this.getDescribes()}
            </div>
        )
    }

});