process.chdir(__dirname);

var sails;
try {
  sails = require('sails');
} catch (e) {
  console.error('Could not find module `sails`.');
  return;
}

var rc;
try {
  rc = require('rc');
} catch (e0) {
  try {
    rc = require('sails/node_modules/rc');
  } catch (e1) {
    console.error('Could not find dependency: `rc`.');
    console.error('`.sailsrc` will be ignored.');
    console.error('To resolve this, run:');
    console.error('npm install rc --save');
    rc = function () { return {}; };
  }
}

sails.lift(rc('sails'));
