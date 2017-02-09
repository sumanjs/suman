const suman = require('suman');
const Test = suman.init(module, {});



Test.create(__filename, {parallel:true}, function (assert, path, fs) {


    const source = path.resolve(global.projectRoot + '/test/fixtures/read-this-file.txt');
    const dest = path.resolve(global.projectRoot + '/test/fixtures/write-to-this-file.txt');

    this.it(' [writable 1] ', function(){

        return fs.createReadStream(source).pipe(fs.createWriteStream(dest));
    });

    this.it(' [readable] ', function(){

        return fs.createReadStream(source).on('data', function(){});

    });

    this.it(' [writable 2] ', function(){

        const z = fs.createWriteStream(dest);
        z.write('summa');
        process.nextTick(function(){
            z.end();
        });
        return z;
    });

    this.it(' [transform] ', function(){



    });

    this.it(' [pipe] ', function(){


    });



});
