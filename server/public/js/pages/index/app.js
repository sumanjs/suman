/**
 * Created by denman on 12/16/15.
 */


define(['react', 'react-dom'], function (React, ReactDOM) {


    var ContactItem = React.createClass({
        propTypes: {
            name: React.PropTypes.string.isRequired
        },

        render: function () {
            return (
                React.createElement('li', {className: 'Contact'},
                    React.createElement('h2', {className: 'Contact-name'}, this.props.name)
                )
            )
        }
    });

    var element = React.createElement(ContactItem, {name: "James K Nelson"});

    ReactDOM.render(element, document.getElementById('react-app'));


    return {
        start: function () {
            console.log('starting...123');
        }
    }


});