/**
 * Passport.js
 */

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt-nodejs');
const passportJWT = require('passport-jwt');
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

module.exports = {
    /**
     * Initialize Passport Auth
     */
    initialize: function() {
        
        // Local Strategy (email address / password)
        passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password'
        }, (email, password, done) => {
            User.findOne({email: email}).exec((err, _user) => {
                if(err) {
                    return done(err);
                }
                if(!_user) {
                    return done(null, false);
                }
                bcrypt.compare(password, _user.password, (err, res) => {
                    if(err) {
                        return done(null, false);
                    }
                    if(!res) {
                        return done(null, false);
                    }
                    const userDetails = {
                        email: _user.email
                    }
                    return done(null, userDetails);
                });
            });
        }));

        // JWT Strategy 
        passport.use(new JWTStrategy({
            jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
            secretOrKey: sails.config.JWT_SECRET
        }, (jwtPayload, cb) => {
            const user = {
                email: jwtPayload.email
            };
            return cb(null, user);
        }));
    }
}