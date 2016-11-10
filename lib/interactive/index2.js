var inquirer = require('inquirer');
var inqDir = require('inquirer-directory');


inquirer.registerPrompt('directory', inqDir);


inquirer.prompt([{
    type: 'directory',
    name: 'from',
    message: 'Where would you like to put this component?',
    basePath: '.'
}]).then(function (answers) {
    console.log('answers =>', answers);
});