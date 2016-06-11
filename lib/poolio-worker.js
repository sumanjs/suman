

//pre-load as many modules as possible :)



process.on('message', function (m) {

    const fp = m.msg.testPath;

    console.log('in poolio worker, message:',m);

    // process.argv.push('--runner');
    process.argv.push(fp);

    // console.log('here are process.argv args:\n');
    // process.argv.forEach((val, index, array) => {
    // 	console.log(`${index}: ${val}`);
    // });

    require('../index');

});




