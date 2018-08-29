/**
 * OrderController
 *
 * @description :: Server-side logic for managing Orders
 * @constraints :: Orders can only be set to "canceled" - they should not be deleted 
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const _ = require('lodash');
const utils = require('../services/Utils.js');
const dataManager = require('../../core/data/datamanager.js');
const executionManager = require('../../core/orders/execution.js');

module.exports = {

    /**
     * Get order for orderId
     */
    getOrder: function(req, res) {
        const id = req.param('id');
        const email = req.user.email;

        if (_.isNil(id) || _.isNil(email)) {
            return res.serverError();
        }
        Order.findOne({id: id}).exec((err, _order) => {
            if(err) {
                sails.log.error(err);
                return res.serverError();
            }
            return res.ok(_order);
        });
    },

    /**
     * Get all existing orders for a user 
     */
    getOrders: function(req, res) {

        const email = req.user.email;
        //const requestGroup = req.user['chiba-server'];
        //const requestEmail = req.user['chiba-server'];

        if (_.isNil(email) || typeof email !== 'string') { 
            return res.serverError();
        }

        Order.find({userId: email}).exec((err, _orders) => {
            if(err) {
                sails.log.error(err); 
                return res.serverError();
            }
            return res.ok(_orders); 
        });
    },

    /**
     * Create a new order 
     */
    createOrder: function(req, res) {

        const email = req.user.email;

        if (_.isNil(email) || typeof email !== 'string') {
            return res.serverError(); 
        }

        // required attributes 
        const orderDirection = req.param('orderDirection'),
            orderType = req.param('orderType'),
            orderAmount = req.param('orderAmount'),
            assetCode = req.param('assetCode');


        // validate that all required attributes are present 
        if(!orderDirection || !orderType || !orderAmount || !assetCode) {
            return res.serverError('missing required attribute in request'); 
        }

        // validate orderAmount, TODO: choose a non-arbitrary max string length
        if(!typeof orderAmount === 'string' || orderAmount.length > 50 || !dataManager.getCurrencyRegex().test(orderAmount) || parseFloat(orderAmount) < 0) {
            return res.serverError('invalid orderAmount');  
        }

        // validate assetCode
        if(!dataManager.getOfferingList().includes(assetCode)) {
            return res.serverError('invalid assetCode'); 
        }

        User.findOne({email: email}).exec((err, _user) => {
            if(err) {
                sails.log.error("error finding user: createOrder");
                return res.serverError();
            }
            if(!_user) {
                sails.log.error("invalid user for order: createOrder");
                return res.serverError();
            }
            
            // initialize object to create 
            const orderData = {
                userId: email,
                orderDirection: orderDirection,
                orderType: orderType,
                orderAmount: orderAmount,
                assetCode: assetCode,
                orderStatus: 'pending'
            };

            // create order 
            Order.create(orderData).exec((err, _createdOrder) => {
                if (err || !_createdOrder) {
                    sails.log.error(err);
                    return res.serverError();
                }
                sails.log.info("Created new order: " + _createdOrder.orderDirection + " " + _createdOrder.orderAmount + " [" + _createdOrder.assetCode + "]");
                executionManager.push(_createdOrder);

                var comfortTimer = Math.random() * (2500 - 800) + 800;
                setTimeout(() => {
                    return res.ok({ orderId: _createdOrder.id });
                }, comfortTimer);
            });
        });
    },

    /**
     * Cancel an existing order
     */
    cancelOrder: function(req, res) {

        const orderId = req.param('orderId');
        const requestGroup = req.user['chiba-server'];
        const requestEmail = req.user['chiba-server'];

        if(_.isNil(orderId)) {
            return res.badRequest('missing order id param');
        }

        // BINANCE call - cancel limit order 

        // User.findOne check 

        Order.update({id: orderId, userEmail: requestEmail}).exec((err, _updatedOrder) => {
            if(err) {
                sails.log.error(err);
                return res.serverError();
            }
            if(!_updatedOrder) {
                return res.notFound();
            }
            return res.ok();
        });
    }
};

