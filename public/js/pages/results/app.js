/**
 * Created by amills001c on 12/16/15.
 */

// http://tylermcginnis.com/reactjs-tutorial-a-comprehensive-guide-to-building-apps-with-react/

define(['SumanTestFiles', 'jquery', 'reactDOM', 'react'], function (stf, $, ReactDOM, React) {

    //function getNext(i){
    //
    //    try{
    //        var testPath = stf[i];
    //    }
    //    catch(err){
    //        return;
    //    }
    //
    //    console.log('testPath:',testPath);
    //
    //    $.get(testPath).done(function (msg) {
    //        var myWorker = new Worker('/js/workers/one.js');
    //        myWorker.postMessage(msg);
    //        myWorker.onmessage = function (msg) {
    //            $('#react-app').append(msg.data);
    //        };
    //
    //    }).fail(function (err) {
    //        console.error(err);
    //    });
    //
    //    setTimeout(function(){
    //        getNext(i++);
    //    },300);
    //
    //
    //}
    //
    //
    //getNext(0);


    function make() {

        var TestResultChooser = React.createFactory(React.createClass({

            displayName: 'test-result-chooser',

            statics: {
                customMethod: function (foo) {
                    return foo === 'bar';
                }
            },

            notifyMe: function () {

            },


            getInitialState: function getInitialState() {
                return {overallTestResults: null};
            },

            changeOverallTestResult: function changeOverallTestResult(value) {
                this.setState({overallTestResults: value});
            },

            render: function render() {

                var self = this;

                var tests = this.props.items.map(function (testPath) {

                    // Create a new Service component for each item in the items array.
                    // Notice that I pass the self.addTotal function to the component.


                    var elem = React.createElement(TestResult, {
                        key: testPath,
                        testName: 'Chewy',
                        testPath: testPath,
                        testResult: null,
                        changeOverallTestResult: self.changeOverallTestResult
                    });

                    //$.get(testPath).done(function (msg) {
                    //    var myWorker = new Worker('/js/workers/one.js');
                    //    myWorker.postMessage(msg);
                    //    myWorker.onmessage = function (msg) {
                    //        //$('#react-app').append(msg.data);
                    //        elem.makeNewState(msg);
                    //    };
                    //}).fail(function (err) {
                    //    console.error(err);
                    //});

                    return elem;


                });

                return React.createElement('div', null, React.createElement('h1', null, 'Test Results:'),
                    React.createElement('div', {id: 'tests'}, tests, React.createElement('p', {id: 'total'}, ' ',
                        React.createElement('b', null, 'Test Results:', this.state.overallTestResults))))

            }
        }));

        var TestResult = React.createFactory(React.createClass({

            displayName: 'test-result',

            getInitialState: function getInitialState() {
                return {
                    active: false
                };
            },

            makeNewState: function makeState(data) {
                this.setState(data);
            },

            componentDidMount: function () {

                var self = this;
                var testPath = this.props.testPath;

                console.log('component did mount:', true);

                $.get(testPath).done(function (msg) {
                    var myWorker = new Worker('/js/workers/one.js');
                    myWorker.postMessage(msg);
                    myWorker.onmessage = function (msg) {
                        //$('#react-app').append(msg.data);
                        console.log('make new state:', msg);
                        //self.makeNewState(msg.data);
                        //self.setState(msg.data);
                        self.setState({testName: 'dogg'});
                        //self.props.changeOverallTestResult();
                    };
                }).fail(function (err) {
                    console.error(err);
                });
            },

            clickHandler: function clickHandler() {

                var active = !this.state.active;

                console.log('clickeddd');

                this.setState({active: active, testName: 'barf'});

                // Notify the ServiceChooser, by calling its addTotal method
                //this.props.addTotal( active ? this.props.price : -this.props.price );

            },

            render: function render() {

                var self = this;

                return React.createElement('p', {
                        className: this.state.active ? 'active' : '',
                        onClick: this.clickHandler,
                    },
                    this.state.testName, '  ', React.createElement('b', null, 'Pass/fail')
                );
            }

        }));


        ReactDOM.render(React.createElement(TestResultChooser, {items: stf}), document.getElementById('react-app'));

    }

    return {
        start: function start() {
            make();
        }
    };
});