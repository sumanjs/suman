/* globals React */

// http://tylermcginnis.com/reactjs-tutorial-a-comprehensive-guide-to-building-apps-with-react/


define([

        '@Accordion',
        '@AccordionSection',
        'jquery',
        'react-dom',
        'react',
        '@ReactController'

    ],

    function (Accordion, AccordionSection, $, ReactDOM, React, ReactController) {

        function start() {
            // ReactDOM.render(React.createElement(Accordion, null), document.getElementById('react-main-mount'));

            ReactController(Accordion, {selected: "2"}, AccordionSection, window.childData, 'react-main-mount');
        }

        return {
            start: start
        };

    });