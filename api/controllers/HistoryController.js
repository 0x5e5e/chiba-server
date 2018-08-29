/**
 * HistoryController
 *
 * @description :: Server-side logic for managing Histories
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const moment = require('moment');
const _ = require('lodash');

module.exports = {

    /**
     * Get History for User
     */
    getHistory: function(req, res) {
        const email = req.user.email;

        if (_.isNil(email)) {
            sails.log.erro("getHistory: id is null");
            return res.serverError();
        }
        History.find({ userId: email }).exec((err, _histories) => {
            if(err || !_histories) {
                sails.log.error("getHistory: histories is null");
                sails.log.error(err);
                return res.serverError();
            }
            var historyEntries = [];
            _histories.forEach((_historyEntry) => {
                historyEntries.push({portfolioValue: _historyEntry.portfolioValue, time: moment(_historyEntry.createdAt).unix()});
            })
            return res.json(historyEntries);
        });
    }
	
};

