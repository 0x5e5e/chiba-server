/**
 * Authentication Policy
 */
const passport = require('passport');

const jwtCheck = passport.authenticate('jwt', {session: false});

module.exports = jwtCheck;