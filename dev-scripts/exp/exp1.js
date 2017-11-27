let n;

try{
  n = cp.spawn(file, []);  //  EACCES error is thrown here
}
catch(err){
  return cb(err);
}
n.usingHashbang = true;
if (!isExecutable) {
  n.once('error', function () {
  // this does not get hit !!
 });
}
