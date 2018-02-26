const suman = require('suman');
const Test = suman.init(module, {});

Test.create({parallel: true}, function (assert, path, fs, $root, it) {

  const source = path.resolve($root + '/test/fixtures/read-this-file.txt');
  const dest = path.resolve($root + '/test/fixtures/write-to-this-file.txt');

  it(' [writable 1] ', function () {

    return fs.createReadStream(source).pipe(fs.createWriteStream(dest));
  });

  it(' [readable] ', function () {

    return fs.createReadStream(source).on('data', function () {});

  });

  it(' [writable 2] ', function () {

    const z = fs.createWriteStream(dest);
    z.write('summa');
    process.nextTick(function () {
      z.end();
    });
    return z;
  });

  it(' [transform] ', function () {

  });

  it(' [pipe] ', function () {

  });

});
