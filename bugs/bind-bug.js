/**
 * Created by Olegzandr on 5/12/16.
 */

this.it.cb('[test] yo 1', {parallel: true}, t => {

    fs.createReadStream('/dev/null').pipe(fs.createWriteStream('/dev/null')).on('error', t.fail.bind(t)).on('finish', t.pass.bind(t));

});

//to avoid this, we can just use the previous methodology