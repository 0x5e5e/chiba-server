/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const _ = require('lodash');
const util = require('util');

module.exports = {

    /**
     * Get User
     */
    getUser: function(req, res) {
        const email = req.user.email;

        if (!email) { // TODO: validation of contents
            console.log("no auth id");
            return res.serverError();
        }

        User.findOne({ email: email }).exec((err, _user) => {
            if(err) {
                sails.log.error(err);
                return res.serverError();
            } 
            if(!_user) {
                return res.serverError();
            }
            const userAccountInfo = {
                email: _user.email,
                created_at: _user.createdAt,
                watchlist: _user.watchlist,
                portfolio: _user.portfolio,
                verified: _user.verified
            };
            return res.json(userAccountInfo); 
        });
    },

    /**
     * Get User's Credit Balance 
     */
    getUserCreditBalance: function(req, res) {

        const email = req.user.email;

        if (!email) { // TODO: validation of contents
            console.log("no auth id");
            return res.serverError();
        }

        User.findOne({ email: email }).exec((err, _user) => {
            if(err) {
                sails.log.error(err);
                return res.serverError();
            } 
            if(!_user) {
                return res.serverError();
            }
            const balanceInfo = {
                creditBalance: _user.creditBalance
            };
            return res.json(balanceInfo); 
        });
    },

    /**
     * Add To Watchlist
     */
    updateWatchlist: function(req, res) {
        const email = req.user.email;

        const watchlistJSON = req.param('watchlist');
        const watchlist = JSON.parse(watchlistJSON);

        if (!email) { 
            return res.serverError();
        }
        if(!Array.isArray(watchlist)) {
            return res.serverError();
        }
        if(watchlist.length > 50) {
            return res.serverError();
        }
        
        User.update({email: email}, {watchlist: watchlist}).exec((err, _updatedUser) => {
            if (err) {
                sails.log.error(err);
                return res.serverError();
            }
            if (!_updatedUser) {
                sails.log.error("invalid user or user watchlist: addToWatchlist");
                return res.serverError();
            }
            return res.ok();
        });
    },

    /**
     * Suspend Account
     */
    suspendAccount: function(req, res) {
        // send automated email 

        return;
    },

    /**
     * Close Account
     */
    closeAccount: function(req, res) {
        // send auomated email 
        
        return;
    }
};

