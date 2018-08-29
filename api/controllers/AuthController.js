/**
 * AuthController.js
 */
const jwt = require('jsonwebtoken');
const passport = require('passport');
const emailAPI = require('../../core/notifications/email.js');
const crypto = require('crypto');

function generateUUID() { // Public Domain/MIT
    return crypto.randomBytes(20).toString('hex');
}

 module.exports = {

    /**
     * Login 
     */
    login: function(req, res) {
        passport.authenticate('local', {session: false}, (err, user, info) => {
            if(err || !user) {
                return res.badRequest();
            }
            req.login(user, {session: false}, (err) => {
                if(err) {
                    return res.serverError();
                }
                const jwtOptions = {
                    algorithm: 'HS256'
                };
                const jwtToken = jwt.sign(user, sails.config.JWT_SECRET, jwtOptions);
                return res.json({user: user, token: jwtToken});
            });
        })(req, res);
    },

    /**
     * Signup
     */
    signup: function(req, res) {
        const email = req.param('email');
        const password = req.param('password');

        if(!email || !password) {
            return res.badRequest();
        }
        if(password.length < 5 || password.length > 35) {
            return res.badRequest();
        }

        const verificationCode = generateUUID();
        const newUser = {
            email: email,
            verified: false,
            verificationCode: verificationCode,
            password: password,
            accountStatus: "active",
            creditBalance: "0.00"
        };
        User.findOne({email: email}).exec((err, _duplicateUser) => {
            if(err) {
                return res.serverError();
            }
            if(!_duplicateUser) {
                User.create(newUser).exec((err, _createdUser) => {
                    if (err) {
                        return res.serverError();
                    }
                    if (!_createdUser) {
                        return res.serverError();
                    }
                    emailAPI.signupConfirmation(_createdUser.email, _createdUser.verificationCode); // send confirmation email
                    return res.ok();
                });
            } else {
                return res.badRequest();
            }
        });
    },

    /**
     * Verify Email
     */
    verification: function(req, res) {
        const hash = req.param('code');
        if(hash) {
            User.findOne({verified: false, verificationCode: hash}).exec((err, _user) => {
                if(err) {
                    sails.log.error(err);
                    return res.serverError();
                }
                if(!_user) {
                    return res.render('verificationFailure');
                }
                User.update({id: _user.id}, {verified: true}).exec((err, _updatedUser) => {

                });
                return res.render('verificationSuccess');
            });
        } else {
            return res.render('verificationFailure');
        }
    },

    /**
     * Resend Email Verification
     */
    resendVerification: function(req, res) {
        const email = req.user.email;
        if(!email) {
            return res.serverError();
        }
        User.findOne({email: email, verified: false}).exec((err, _user) => {
            if(err || !_user) {
                return res.serverError();
            }
            emailAPI.signupConfirmation(_user.email, _user.verificationCode);
            return res.ok();
        });
    },

    /**
     * Password Reset 
     */
    passwordReset: function(req, res) {
        // TODO: implement
        return res.ok();
    }

    /**
     * 2FA, Fingerprint Auth 
     */
 }
