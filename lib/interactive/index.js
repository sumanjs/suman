var inquirer = require('inquirer');

var preguntas = [
    {
        type: 'input',
        name: 'nombre',
        message: 'Nombre Completo?',
        default: 'Jose Perez'
    },
    {
        type: 'confirm',
        name: 'casado',
        message: 'Casado?',
    },
    {
        when: function (response) {
            return response.casado;
        },
        type: 'input',
        name: 'hijos',
        message: 'Número de hijos?',
    },
    {
        type: 'list',
        name: 'estudios',
        message: 'Nivel academico?',
        choices: [
            'Primaria',
            'Secundaria',
            new inquirer.Separator(),
            'Bachillerato',
            'Licenciatura',
            'Doctorado'
        ]
    },
    {
        type: 'checkbox',
        message: 'Servicios Publicos',
        name: 'servicios',
        choices: [
            {
                name: 'Agua'
            },
            {
                name: 'Luz',
                checked: true
            },
            {
                name: 'Internet'
            },
        ],
    }
];

inquirer.prompt(preguntas).then(function (respuestas) {
    console.log('Respuestas => ', respuestas);
}, function (err) {
    console.error(err.stack || err);
});