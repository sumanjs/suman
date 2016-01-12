// collection of test files
var testFiles = [];

// Used to convert paths to find test files
var pathToModule = function(path) {
    return path.replace(/^\/base\//, "../../").replace(/\.js$/, '');
};

// Loop over each file karma is aware of and check which are test file
Object.keys(window.__karma__.files).forEach(function(file) {
    if (/\.spec\.js$/.test(file)) {
        testFiles.push(pathToModule(file));
    }
});

// The nitty gritty
requirejs.config({
    baseUrl: "/base/www/js/",

    paths: {
        // If you want to actually test your modules, you put those here.
        // Just like a standard requirejs config
    },

    deps: testFiles,

    // kickoff jasmine
    callback: window.__karma__.start
});