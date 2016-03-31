/**
 * Created by amills001c on 3/30/16.
 */




define(['react'], function(React){



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


    return Accordion;

});