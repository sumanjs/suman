/**
 * Created by denman on 6/9/15.
 */


window.startDate = Date.now(); //this is for debugging the performance of application


console.log('loading app/js/main.js ---> (0) ---> time:', (Date.now() - window.startDate));


requirejs.config({
    enforceDefine: false,
    waitSeconds: 7,
    baseUrl: '/',
    paths: {

        //CDN
        'async': '//cdnjs.cloudflare.com/ajax/libs/async/1.5.0/async.min',
        'jquery': '//cdnjs.cloudflare.com/ajax/libs/jquery/3.0.0-alpha1/jquery.min',
        'flux': '//cdnjs.cloudflare.com/ajax/libs/flux/2.1.1/Flux.min',
        'underscore': '//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min',
        'react': '//cdnjs.cloudflare.com/ajax/libs/react/0.14.3/react',
        'react-dom': '//cdnjs.cloudflare.com/ajax/libs/react/0.14.3/react-dom',
        'socketio': '//cdnjs.cloudflare.com/ajax/libs/socket.io/1.3.7/socket.io.min',
        'lodash': '//cdnjs.cloudflare.com/ajax/libs/lodash.js/4.7.0/lodash',


        //local
        '@Accordion': 'js/react-components/AccordionComp',
        '@AccordionSection': 'js/react-components/AccordionSection',
        '@ReactController': 'js/react-components/react-controller',
        'TestFileSuite': 'js/react-components/TestFileSuite'
    },

    'shim': {

        'underscore': {
            'exports': '_'
        }
    }

});

console.log('starting app ---> (1) ---> time:', (Date.now() - window.startDate));

requirejs.onResourceLoad = function (context, map, depArray) {
    var duration = Date.now() - window.startDate;
    console.log('onResourceLoad>>>', 'duration:', duration + "ms", 'map.id:', map.id);
};


require(['jquery', 'flux', 'socketio', 'react', 'react-dom', 'underscore', 'async', 'lodash'], function () {

    $(document).ready(function () {


        require(['js/pages/results/app'], function (Application) {
            console.log('Application module loaded ----> (3) ----> time:', (Date.now() - window.startDate));
            Application.start();
        });


    });

});









