const path = require('path');
const sumanUtils = require('suman-utils/utils');

//////////////////////////////////////////////////////////////////////

const scripts = path.resolve(__dirname + '/scripts');

function getScript (s) {
  return path.resolve(scripts + '/' + s + '.sh');
}

function getBuildArgs (name) {
  return ' --build-arg s=' + 'scripts/' + name + '.sh' + ' --build-arg sname=' + name + '.sh '
}

const projectRoot = sumanUtils.findProjectRoot(process.cwd());


function build(){
  return 'cd ' + __dirname + ' &&  docker build ' + getBuildArgs(this.name) + ' -t ' + this.name + ' .'
}

function run(){
  return 'cd ' + __dirname + ' &&  docker build ' + getBuildArgs(this.name) + ' -t ' + this.name + ' .'
}


module.exports = data => {

  return {

    //TODO: have to handle the case where the build has already been built - don't want to rebuild container

    // put in .suman/groups/scripts
    // if pathToScript is null/undefined, will read script with the same name as the group in the above dir

    groups: [

      {
        name: 'a',
        useContainer: true,
        //the machine hopefully *already* has the build saved on the fs, so won't have to rebuild
        build: function () {
          // return 'cd ' + __dirname + ' &&  docker build --build-arg s=' + getScript(this.name) + ' -t ' + this.name + ' .'
          return 'cd ' + __dirname + ' &&  docker build ' + getBuildArgs(this.name) + ' -t ' + this.name + ' .'
        },
        pathToScript: '',
        run: function () {
          return 'docker run -it --tty=false --rm ' + this.name;
        },

      },

      {
        name: 'b',
        useContainer: true,
        //the machine hopefully *already* has the build saved on the fs, so won't have to rebuild
        build: function () {
          // return 'cd ' + __dirname + ' &&  docker build --build-arg s=' + getScript(this.name) + ' -t ' + this.name + ' .'
          return 'cd ' + __dirname + ' &&  docker build ' + getBuildArgs(this.name) + ' -t ' + this.name + ' .'
        },
        pathToScript: '',
        run: function () {
          return 'docker run -it --tty=false --rm ' + this.name;
        },

      },

    ]
  }

};

