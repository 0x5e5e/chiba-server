/**
 * User.js
 */
const settings = require('../../config/settings.js');
const bcrypt = require('bcrypt-nodejs');
const _ = require('lodash');

module.exports = {

    attributes: {

        /**
         * ID (User)
         * AUTO-POPULATED
         */

        /**
         * Email Address
         */
        email: {
            type: 'string',
            required: true,
            unique: true
        },

        /**
         * First Name
         */
        firstName: {
            type: 'string'
        },

        /**
         * Last Name
         */
        lastName: {
            type: 'string'
        },

        /**
         * Email Verified
         */
        verified: {
            type: 'boolean',
            required: true
        },

        /**
         * Verification Code
         */
        verificationCode: {
            type: 'string',
            required: true
        },

        /**
         * Password
         */
        password: {
            type: 'string',
            required: true
        },

        /**
         * Account Status
         */
        accountStatus: {
            type: 'string',
            defaultsTo: 'active',
            enum: ['active', 'suspended', 'closed']
        },

        /**
         * Credit Balance
         */
        creditBalance: {
            type: 'string',
            required: true,
            defaultsTo: "0.00"
        },

        /**
         * Watchlist
         */
        watchlist: {
            type: 'array',
            defaultsTo: settings.defaultWatchlist
        },

        /**
         * Portfolio
         */
        portfolio: {
            type: 'array',
            defaultsTo: []
        }

        /**
         * updatedAt
         * AUTO-UPDATED
         */

        /**
         * createdAt
         * AUTO-UPDATED
         */

    },

    customToJSON: function () {
        return _.omit(this, ['password'])
    },

    // beforeCreate hook - runs before model creation
    beforeCreate: function (user, cb) {
        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(user.password, salt, null, function (err, hash) {
                if (err) return cb(err);
                user.password = hash;
                return cb();
            });
        });
    }
};