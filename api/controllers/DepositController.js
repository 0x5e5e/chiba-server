/**
 * DepositController
 *
 * @description :: Server-side logic for managing Deposits
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const paybear = require('../../core/transactions/deposit/paybear.js');
const request = require('request');
const money = require('money-math');
const moment = require('moment'); 

module.exports = {

    /**
     * Get Deposits
     */
    getDeposits: function(req, res) {
        const email = req.user.email

        if (!email) {
            return res.serverError();
        }

        Deposit.find({ userId: email }).exec((err, _deposits) => {
            if (err) {
                sails.log.error("Error finding user: createDeposit");
                return res.serverError();
            }
            if (!_deposits || _deposits.length <= 0) {
                // invalid user
                sails.log.error("No user found for deposit request");
                return res.serverError();
            }
            var toReturn = [];
            _deposits.forEach((_d) => {
                if(_d.status !== 'started') {
                    toReturn.push({ depositType: 'deposit', depositAmount: _d.depositAmount, depositMethod: _d.depositMethod, status: _d.status, depositCurrency: _d.depositCurrency, credited: _d.credited });
                }
            });
            return res.json(toReturn);
        });
    },

    /**
     * Create Crypto Deposit request
     */
    createDeposit: function(req, res) {
        const email = req.user.email

        const depositAmount = req.param('depositamount');
        const depositCurrency = req.param('depositcurrency');

        if (!email || !depositAmount || !depositCurrency) {
            return res.serverError();
        }

        sails.log.debug("createdDeposit -> depositAmount: " + depositAmount + ", depositCurrency: " + depositCurrency); 

        User.findOne({ email: email }).exec((err, _user) => {
            if(err) {
                sails.log.error("Error finding user: createDeposit");
                return res.serverError();
            }
            if(!_user) {
                // invalid user
                sails.log.error("No user found for deposit request");
                return res.serverError();
            }
            Deposit.create({ userId: email, depositAmount: depositAmount, depositCurrency: depositCurrency, depositMethod: 'crypto', status: 'started' }).exec((err, _created) => {
                if (err || !_created || !_created.id) {
                    return res.serverError();
                }
                sails.log.debug("Created deposit with status: started");
                return res.json({ orderId: _created.id });
            });
        });
    },

    /**
     * Payment callback 
     */
    callback: function(req, res) {

        let orderId = req.param('order');
        let data = req.body;
        let invoice = data.invoice;

        if(!orderId || !data || !invoice) {
            return res.serverError();
        }

        //sails.log.debug("payment callback = " + JSON.stringify(data));
        sails.log.debug("# of confirmations = " + data.confirmations);

        Deposit.findOne({id: orderId, invoice: invoice}).exec((err, _deposit) => {
            if(err || !_deposit) {
                sails.log.error("Error finding deposit")
                return res.serverError();
            }
            
            // update deposit invoice with # of confirmations - we trust invoice # from callback 
            if(data.confirmations > 0) {

                sails.log.debug("data.confirmations > 0");

                // after min. # of confirmations, credit user with deposit amt 
                if(data.confirmations === sails.config.MIN_CONFIRMATIONS) {
                    
                    // check three things: 1. id, 2. invoice #, 3. status -> pending 
                    Deposit.findOne({id: orderId, status: 'pending'}).exec((err, _matchingOrder) => {
                        if(err) {
                            sails.log.error("Error matching deposit to confirmation");
                            return;
                        }
                        if(!_matchingOrder) {
                            sails.log.error("Error finding matching order.  orderId: " + orderId + ", invoice #: " + data.invoice);
                            return;
                        }

                        let amountPaid = data.inTransaction.amount / Math.pow(10, data.inTransaction.exp);

                        sails.log.debug("amountPaid = " + amountPaid);
                        sails.log.debug("invoice # = " + invoice);

                        request.get('https://api.paybear.io/v2/exchange/usd/rate', (err, resp, bd) => {
                            if (err || !bd) {
                                console.log(err);
                                return;
                            }
                            let exchangeData = JSON.parse(bd);
                            if (exchangeData && exchangeData.success) {
                                const bitcoinPrice = exchangeData.data.btc.mid;
                                sails.log.debug("bitcoinPrice = " + bitcoinPrice);

                                const amountToCredit = (bitcoinPrice * amountPaid).toFixed(2);
                                if(!amountToCredit) {
                                    sails.log.error("invalid amountToCredit");
                                    return;
                                }

                                sails.log.debug("amountToCredit: " + amountToCredit + ", quotedAmount: " + _matchingOrder.depositAmount);
                                
                                const amountBeforeFees = Math.min(parseFloat(amountToCredit), parseFloat(_matchingOrder.depositAmount));
                                const fees = 0.18 + ((Math.floor(Math.random() * 10)) / 100); 
                                const actualAmountToCredit = (amountBeforeFees).toFixed(2);
                                const difference = Number.parseFloat(_matchingOrder.depositAmount) - Number.parseFloat(actualAmountToCredit);

                                User.findOne({email: _matchingOrder.userId}).exec((err, _userToCredit) => {
                                    if(err) {
                                        sails.log.error("Error finding user to credit");
                                        return;
                                    }
                                    if(!_userToCredit) {
                                        sails.log.error("could not find user to credit for email: " + _matchingOrder.userId);
                                        return;
                                    }

                                    const currentCreditBalance = _userToCredit.creditBalance;
                                    if(!currentCreditBalance) {
                                        sails.log.error("invalid current credit balance");
                                        return;
                                    }
                                    const newCreditBalance = money.add(currentCreditBalance, actualAmountToCredit);
                                    if (money.isNegative(newCreditBalance)) {
                                        sails.log.error("negative current credit balance after deposit: " + newCreditBalance);
                                        return;
                                    }
                                    User.update({email: _matchingOrder.userId}, {creditBalance: newCreditBalance}).exec((err, _updatedCreditUser) => {
                                        if(err || !_updatedCreditUser) {
                                            sails.log.error("error updating user with new credit balance");
                                            return;
                                        }

                                        Deposit.update({ id: orderId }, { status: 'completed', credited: actualAmountToCredit, confirmations: data.confirmations.toString(), difference: difference.toFixed(2), actualPaid: amountToCredit}).exec((err, _finalizedDeposit) => {
                                            if(err || !_finalizedDeposit) {
                                                sails.log.error("error marking deposit as completed");
                                                return;
                                            }
                                        });
                                    });
                                });
                            }
                        });
                    });
                } else {

                    sails.log.debug("Updating order: " + orderId + " with confirmations: " + data.confirmations.toString());

                    Deposit.update({id: orderId}, {confirmations: data.confirmations.toString()}).exec((err, _updatedDeposit) => {
                        if (err) {
                            sails.log.error("Error updating deposit with # of confirmations: " + data.confirmations.toString());
                            return res.serverError();
                        }
                        return (data.confirmations > 5) ? res.send(invoice) : res.ok();
                    });
                }
            } else {

                sails.log.debug("data.confirmations <= 0");

                // 0 confirmations but registered on network
                Deposit.update({id: orderId}, {status: 'pending'}).exec((err, _depositStatusUpdate) => {
                    if(err) {
                        sails.log.error(err);
                        return res.serverError();
                    }
                    return res.ok();
                });
            }
        });
    },

    /**
     * Get Currencies
     */
    getCurrencies: function(req, res) {
        const email = req.user.email

        if (!email) {
            return res.serverError();
        }

        if(req.query.order) {
            var orderId = req.query.order;

            Deposit.findOne({id: orderId, userId: email}).exec((err, _deposit) => {
                if(err || !_deposit) {
                    sails.log.error("could not find deposit for id: " + orderId);
                    return res.serverError();
                }
                var fiatTotal = parseFloat(_deposit.depositAmount); //get from order
            
                var token = req.query.token;
                
                if(token) {
                    paybear.getCurrency(token, orderId, true, function (curr) {
                        res.json(curr); //return this data to PayBear form
                    });
                } else {

                    currs = [];
                    paybear.getCurrencies(function(currs) {
                        currs.forEach(function(curr) {
                            paybear.getCurrency(curr.code, orderId, true, function(currency) {
                                currs.push(currency);
                            });
                        });
                    });
                
                    var i = setInterval(function() {
                        if (currs.length >= 6) {
                            clearInterval(i);
                            res.json(currs); //return this data to PayBear form
                        }
                    }, 100);
                }
            });
        } else {
            res.json({error: 'send the order number'});
        }
    },

    /**
     * Order status 
     */
    status: function(req, res) {

        var orderId = req.param('order');

        var confirmations = null;
        
        Deposit.findOne({id: orderId}).exec((err, _dd) => {
            if(err || !_dd) {
                sails.log.error("could not find deposit for status");
                return res.serverError();
            }

            if(_dd.confirmations) {
                confirmations = parseFloat(_dd.confirmations);
            }
            
            var resp = {
                success: confirmations >= 1
              };
              
            if (confirmations !== null) {
                resp['confirmations'] = confirmations;
            } 
              
            res.json(resp); // return this data to PayBear form
        });
        
    }
	
};

