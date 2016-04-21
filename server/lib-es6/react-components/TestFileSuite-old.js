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

    recurse: function recurse(item) {

        var children = this.findChildren(item.children.map(function (child) {
            return child.testId;
        }));

        return (
            
            <div className="describe">
                {item.desc}
                <div className="test-cases">
                    Test Cases:
                    {JSON.stringify(item.tests)}
                </div>
                <div className="suite-children">
                    {item.children.length > 0 ? 'Children of ' + item.desc : '(no children)'}
                    {children.map((child) => {
                        return this.recurse(child);
                    })}
                </div>

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