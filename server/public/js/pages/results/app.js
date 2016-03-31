/* globals React */

// http://tylermcginnis.com/reactjs-tutorial-a-comprehensive-guide-to-building-apps-with-react/

define(['@Accordion', 'jquery', 'reactDOM', 'react', 'js/utils/parse-results'], function (Accordion, $, ReactDOM, React, Utils) {

    function start() {
        ReactDOM.render(React.createElement(Accordion, null), document.getElementById('react-main-mount'));
    }

    return {
        start: start
    };
});