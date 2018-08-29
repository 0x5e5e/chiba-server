/**
 * manage portfolio history
 */
const cron = require('node-cron');
const request = require('request');
const data = require('../data/datamanager.js');

const CRYPTOCOMPARE_API = 'https://min-api.cryptocompare.com/data/';

let portfolioPriceData = {}; 

function getPriceData() {

    var offering = data.getOfferingList();
    var batch1 = offering.slice(0,60);
    var batch2 = offering.slice(60);

    request.get(CRYPTOCOMPARE_API + 'pricemulti?fsyms=' + batch1.join() + '&tsyms=USD', (err1, resp1, bd1) => {
        if(err1 || !bd1) {
            sails.log.error("error retrieving pricemultifull data");
            return;
        }
        try {
            let receivedData1 = JSON.parse(bd1);
            if(receivedData1) {

                request.get(CRYPTOCOMPARE_API + 'pricemulti?fsyms=' + batch2.join() + '&tsyms=USD', (err2, resp2, bd2) => {
                    if(err2 || !bd2) {
                        sails.log.error("error retrieving pricemultifull data");
                        return;
                    }
                    try {
                        let receivedData2 = JSON.parse(bd2);
                        let receivedDataJoined = {
                            ...receivedData1,
                            ...receivedData2
                        }
                        if(receivedDataJoined) {

                            Object.keys(receivedDataJoined).forEach((key) => {
                                portfolioPriceData[key] = {};
                                if(!receivedDataJoined[key].USD) {
                                    sails.log.debug("could not find " + key);
                                    return;
                                }
                                portfolioPriceData[key].price = receivedDataJoined[key].USD;
                            });
                        }
                    } catch(e) {
                        sails.log.error(e);
                    }
                });
            }
        } catch(e) {
            sails.log.error(e);
        }
    });
}

function updateHistoryMulti(_users) {
    if(!_users || _users.length <= 0) {
        sails.log.error("updateHistoryMulti should be called with valid collection of users");
        return;
    }
    _users.forEach((_user) => {
        if(!_user.portfolio || !_user.creditBalance || !_user.email) {
            sails.log.error("updateHistoryMulti: invalid user");
            return;
        }

        let portfolioValue = 0;
        if(_user.portfolio.length > 0) {
            _user.portfolio.forEach((_port) => {
                var ticker = _port.ticker;
                var amt = parseFloat(_port.amount);
                if(portfolioPriceData[ticker]) {
                    portfolioValue += portfolioPriceData[ticker].price * amt;
                } else {
                    sails.log.error("Portfolio price data for ticker: " + ticker + " does not exist");
                }
            });
        }

        if(portfolioValue.toFixed <= 0) { // TODO: rework this calculation 
            return;
        }

        const historyEntry = {
            userId: _user.email,
            portfolioValue: portfolioValue.toFixed(2),
            creditBalance: _user.creditBalance,
            portfolio: _user.portfolio
        };
        History.create(historyEntry).exec((err, _createdEntry) => {
            if(err || !_createdEntry) {
                sails.log.error("error creating history entry");
                return;
            }
            //sails.log.debug("created history entry: " + JSON.stringify(_createdEntry));
        });
    });
}

function updateHistory(_user) {
    sails.log.debug("updateHistory");
    if (!_user.portfolio || !_user.creditBalance || !_user.email) {
        sails.log.error("updateHistory: invalid user");
        return;
    }
    let portfolioValue = 0;
    if(_user.portfolio.length > 0) {
        _user.portfolio.forEach((_port) => {
            var ticker = _port.ticker;
            var amt = parseFloat(_port.amount);
            if(portfolioPriceData[ticker]) {
                portfolioValue += portfolioPriceData[ticker].price * amt;
            } else {
                sails.log.error("Portfolio price data for ticker: " + ticker + " does not exist");
            }
        });
    }

    if(portfolioValue.toFixed <= 0) { // TODO: rework this calculation 
        return;
    }

    const historyEntry = {
        userId: _user.email,
        portfolioValue: portfolioValue.toFixed(2),
        creditBalance: _user.creditBalance,
        portfolio: _user.portfolio
    };
    sails.log.debug("historyEntry = " + JSON.stringify(historyEntry));
    History.create(historyEntry).exec((err, _createdEntry) => {
        if(err || !_createdEntry) {
            sails.log.error("error creating history entry");
            return;
        }
        //sails.log.debug("created history entry: " + JSON.stringify(_createdEntry));
    });
}

module.exports = {

    start: function() {

        // populate price data for offering 
        getPriceData();

        // schedule hourly update of history for all users 
        cron.schedule('0 * * * *', () => {
            User.find({accountStatus: 'active'}).exec((err, _users) => {
                if(err || !_users) {
                    return sails.log.error("hourly history update error: " + JSON.stringify(err));
                }
                if(_users.length > 0) {
                    updateHistoryMulti(_users);
                }
            });
        });

        // schedule minute by minute updates of price data for offering
        cron.schedule('* * * * *', () => {
            getPriceData();
        });

        sails.log.debug("History cycle started");
    },

    updateHistory: function(_user) {
        updateHistory(_user);
    }
}