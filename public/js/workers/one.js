/**
 * Created by amills001c on 12/16/15.
 */



if(typeof importScripts === 'function'){
    importScripts('https://cdnjs.cloudflare.com/ajax/libs/react/0.14.3/react.js');
    importScripts('https://cdnjs.cloudflare.com/ajax/libs/react/0.14.3/react-dom.js');
    importScripts('/js/vendor/react-dom-server.js');
}


//importScripts('/js/vendor/require.js');


//require(['react','reactDOM'],function(React,ReactDOM){

    onmessage = function(msg) {

        var ContactItem = React.createFactory(React.createClass({

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
        }));

        var str = ReactDOMServer.renderToString(ContactItem({name:'charlie'}));
        postMessage(str);

    };

//});
