const binance = require('../adapters/binance.js');
const sequentialTaskQueue = require('sequential-task-queue').SequentialTaskQueue;
const dataManager = require('../data/datamanager.js');
const money = require('money-math');
const request = require('request');
const history = require('../portfolio/history.js');

const CRYPTOCOMPARE_API = 'https://min-api.cryptocompare.com/data/';

let queue = null;

function updatePortfolio(id) {
    User.findOne({email: id}).exec((err, _user) => {
        let portfolio = [];
        if(!portfolio) {
            sails.log.error("user portfolio does not exist");
            return;
        }
        Coin.find({userId: id}).exec((err, _coins) => {
            if(err) {
                sails.log.error("error finding coins");
                return;
            }
            if(_coins) {
                _coins.forEach((_coin) => {
                    if(parseFloat(_coin.balance) > 0.001) {
                        portfolio.push({ticker: _coin.assetCode, amount: _coin.balance, price: _coin.lastQuotedPrice});
                    }
                });
                User.update({email: id}, {portfolio: portfolio}).exec((err, _updatedUser) => {
                    if(err) {
                        sails.log.debug("error updating user: " + err);
                        return;
                    }
                    history.updateHistory(_user);
                });
            }
        });
    });
}

function executeOrder(_order) {

    sails.log.debug("Processing order... " + JSON.stringify(_order));

    return new Promise((resolve, reject) => {

        let id = _order.userId;
        let orderDirection = _order.orderDirection;
        let orderType = _order.orderType;
        let orderAmount = _order.orderAmount;
        let assetCode = _order.assetCode;

        if(!orderAmount || typeof orderAmount !== 'string' || parseFloat(orderAmount) < 0) { 
            reject(id);
            return;
        }

        switch(orderDirection) {
            case 'buy':
                User.findOne({ email: id }).exec((err, _user) => {
                    if(err || !_user || !_user.creditBalance || !dataManager.getCurrencyRegex().test(_user.creditBalance)) {
                        reject(id);
                        return;
                    }
                    const currentCreditBalance = _user.creditBalance;
                    const newCreditBalance = money.subtract(currentCreditBalance, orderAmount);
                    if(money.isNegative(newCreditBalance)) {
                        reject(id);
                        return;
                    }
                    User.update({ email: id }, {creditBalance: newCreditBalance}).exec((err, _updatedUser) => {
                        if(err || !_updatedUser) {
                            sails.log.error("[CRITICAL] Failed to modify user's credit balance");
                            reject(id);
                            return;
                        }
                        if(_updatedUser.length > 1) {
                            sails.log.error("[CRITICAL] Duplicate User ID's found");
                        }
                        request.get(CRYPTOCOMPARE_API + 'pricemultifull?fsyms=' + assetCode + '&tsyms=USD', (err1, resp1, bd1) => {
                            if(err1 || !bd1) {
                                sails.log.error("error retrieving pricemultifull data");
                                return;
                            }
                            try {
                                let receivedData1 = JSON.parse(bd1);
                                if(receivedData1) {
                                    let price = receivedData1.RAW[assetCode].USD.PRICE;
                                    if(!price) {
                                        reject(id); 
                                    }
                                    sails.log.debug("PRICE = "  + price);
                                    const amountToAdd = (parseFloat(orderAmount) / price).toFixed(6);
                                    Coin.findOne({userId: id, assetCode: assetCode}).exec((err, _coin) => {
                                        if(err) {
                                            reject(id);
                                            return;
                                        }
                                        Order.update({userId: id}, {orderStatus: 'completed', executedPrice: parseFloat(price).toFixed(2), executedAmount: amountToAdd}).exec((err, _updated) => {
                                            if(err || !_updated) {
                                                sails.log.error("[CRITICAL] Error setting order to canceled after failed modification");
                                                reject(id);
                                            }
                                        });
                                        if(!_coin) { // no existing coin, create one
                                            Coin.create({userId: id, assetCode: assetCode, balance: amountToAdd, lastQuotedPrice: parseFloat(price).toFixed(2)}).exec((err, _createdCoin) => {
                                                if(err) {
                                                    reject(id);
                                                    return;
                                                }
                                                updatePortfolio(id);
                                                resolve();
                                            })
                                        } else {
                                            const newBalance = (parseFloat(amountToAdd) + parseFloat(_coin.balance)).toFixed(6);
                                            Coin.update({userId: id, assetCode: assetCode}, {balance: newBalance, lastQuotedPrice: parseFloat(price).toFixed(2)}).exec((err, _updatedCoin) => {
                                                if(err) {
                                                    reject(id);
                                                    return;
                                                }
                                                updatePortfolio(id);
                                                resolve();
                                            })
                                        }
                                    });
                                }
                            } catch(e) {
                                sails.log.error(e);
                            }
                        });
                    });
                });
                break;
            case 'sell':
                request.get(CRYPTOCOMPARE_API + 'pricemultifull?fsyms=' + assetCode + '&tsyms=USD', (err1, resp1, bd1) => {
                    if(err1 || !bd1) {
                        sails.log.error("error retrieving pricemultifull data");
                        return;
                    }
                    try {
                        let receivedData1 = JSON.parse(bd1);
                        if(receivedData1) {
                            let price = receivedData1.RAW[assetCode].USD.PRICE;
                            if(!price) {
                                sails.log.error("error #001");
                                reject(id); 
                            }
                            sails.log.debug("PRICE = "  + price);
                            const amountToSubtract = (parseFloat(orderAmount) / price).toFixed(6);
                            Coin.findOne({userId: id, assetCode: assetCode}).exec((err, _coin) => {
                                if(err) {
                                    sails.log.error("error #002");
                                    reject(id);
                                    return;
                                }
                                if(!_coin) { 
                                    sails.log.error("error #003");
                                    reject(id);
                                    return;
                                } 

                                let newBalance = parseFloat((parseFloat(_coin.balance) - parseFloat(amountToSubtract)).toFixed(6));  // e.g. parseFloat -> (3022.597026 - 2976.197064).toFixed(6)
                                let actualCoinsSold = 0;
                                let newBalanceWorth = (newBalance > 0) ? newBalance * price : 0;
                                if(newBalance < 0.0001 || newBalanceWorth < 1) { // coin balance too small, convert to SELL ALL order 
                                    newBalance = 0;
                                    orderAmount = (parseFloat(_coin.balance) * price).toFixed(2);
                                    actualCoinsSold = parseFloat(_coin.balance);
                                    sails.log.debug("coin balance too small, converted to SELL ALL.  nB: 0, orderAmount: " + orderAmount);
                                } else {
                                    actualCoinsSold = parseFloat(amountToSubtract);
                                }

                                Coin.update({userId: id, assetCode: assetCode}, {balance: newBalance.toFixed(6)}).exec((err, _updatedCoin) => {
                                    if(err) {
                                        sails.log.error("error #005");
                                        reject(id);
                                        return;
                                    }
                                    updatePortfolio(id);
                                    User.findOne({ email: id }).exec((err, _user) => {
                                        if(err || !_user || !_user.creditBalance || !dataManager.getCurrencyRegex().test(_user.creditBalance)) {
                                            sails.log.error("[CRITICAL] could not find user while completing sell order");
                                            reject(id);
                                            return;
                                        }
                                        const currentCreditBalance = _user.creditBalance;
                                        const newCreditBalance = money.add(currentCreditBalance, orderAmount);
                                        if(money.isNegative(newCreditBalance)) {
                                            sails.log.error("error #006");
                                            reject(id);
                                            return;
                                        }
                                        User.update({ email: id }, {creditBalance: newCreditBalance}).exec((err, _updatedUser) => {
                                            if(err || !_updatedUser) {
                                                sails.log.error("[CRITICAL] Failed to modify user's credit balance");
                                                reject(id);
                                                return;
                                            }
                                            if(_updatedUser.length > 1) {
                                                sails.log.error("[CRITICAL] Duplicate User ID's found");
                                            }
                                            Order.update({userId: id}, {orderStatus: 'completed', executedPrice: price.toFixed(2), executedAmount: actualCoinsSold.toFixed(6), orderAmount: orderAmount}).exec((err, _updated) => {
                                                if(err || !_updated) {
                                                    sails.log.error("[CRITICAL] Error setting order to canceled after failed modification");
                                                    reject(id);
                                                    return;
                                                }
                                                resolve();
                                            });
                                        });
                                    });
                                });
                            });
                        }
                    } catch(e) {
                        sails.log.error("error #007: " + e);
                        sails.log.error(e);
                    }
                });
                break;
            default:
                sails.log.error("[CRITICAL] invalid orderDirection: " + orderDirection);
                reject(id);
                break;
        }
    });
}

const handleExecutionError = (_orderId) => {
    sails.log.debug("_orderId = " + _orderId);
    sails.log.debug("execution error.  canceling order");
    if(_orderId) {
        Order.update({userId: _orderId}, {orderStatus: 'canceled'}).exec((err, _updatedOrder) => {
            if(err | !_updatedOrder) {
                sails.log.error("[CRITICAL] failed to update a failed order");
            }
        });
    }
};

module.exports = {

    /**
     * Start executing orders
     */
    start: function() {
        return new Promise((resolve, reject) => {
            sails.log.debug("Order execution started"); 

            queue = new sequentialTaskQueue();

            queue.on('error', handleExecutionError);

            // clean up order pipeline
            Order.find({orderStatus: 'pending'}).exec((err, _orders) => {

                if(err || !_orders) {
                    sails.log.error(JSON.stringify(err));
                    reject('Error retrieving pending orders');
                    return;
                }

                if(_orders.length > 0) {
                    sails.log.debug("Flushing order pipeline");
                    _orders.forEach((_order) => {
                        Order.update({id: _order.id}, {orderStatus: 'canceled'}).exec((err, _updatedOrder) => {
                            if(err || !_updatedOrder) {
                                reject('Error updating order');
                                return;
                            }
                        });
                    });
                } else {
                    sails.log.debug("No pending orders to flush.  continuing...");
                }

                resolve();
            });
        });
    },

    /**
     * Shutdown execution manager 
     */
    shutdown: function() {
        return new Promise(() => {
            queue.close(false).then(() => {
                sails.log.debug("Order execution shut down.");
            });
        });
    },

    /**
     * Push order task to queue
     */
    push: function(_order) {
        if(!_order) {
            return;
        }
        sails.log.debug("Pushing order to stack");
        queue.push(executeOrder, {args: _order});
        queue.wait().then(() => {
            sails.log.debug("completed");
        });
    }
};
