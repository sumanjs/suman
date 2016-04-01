

const React = require('react');


var Section = React.createClass({
    
    handleClick: function (e) {

        console.log('event:',e);

        if (this.state.open) {
            this.setState({
                open: false,
                class: "section"
            });
        } else {
            this.setState({
                open: true,
                class: "section open"
            });
        }
    },
    getInitialState: function () {
        return {
            open: false,
            class: "section"
        }
    },
    render: function () {
        return (
            <div className={this.state.class}>
                <button>toggle</button>
                <div className="sectionhead" onClick={this.handleClick}>{this.props.title}</div>
                <div className="articlewrap">
                    <div className="article">
                        {this.props.children}
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = Section;
