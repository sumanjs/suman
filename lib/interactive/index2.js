var inquirer = require('inquirer');
var inqDir = require('inquirer-directory');


inquirer.registerPrompt('directory', inqDir);


inquirer.prompt([{
    type: 'directory',
    name: 'from',
    message: 'Where you like to put this component?',
    basePath: '.'
}], function (answers) {
    console.log('answers =>', answers);
});