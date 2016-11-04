const inquirer = require('inquirer');

const PathPrompt = require('inquirer-path').PathPrompt;

const questions = [{
    type: 'path',
    name: 'path',
    message: 'Enter a path',
    default: process.cwd(),
}];

inquirer.prompt(questions, function(result) {
    console.log(result.path);
});