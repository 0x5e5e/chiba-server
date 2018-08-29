/**
 * Deposit.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
const emailAPI = require('../../core/notifications/email.js');

module.exports = {

    attributes: {

        /**
         * User Id of requester
         */
        userId: {
            type: 'string',
            required: true
        },

        /**
         * Deposit Amt (USD)
         */
        depositAmount: {
            type: 'string',
            required: true
        },

        /**
         * Deposit Method
         */
        depositMethod: {
            type: 'string',
            required: true,
            enum: ['crypto', 'creditcard', 'bank']
        },

        /**
         * Deposit Status 
         */
        status: {
            type: 'string',
            required: true,
            enum: ['started', 'pending', 'failed', 'completed'],
            defaultsTo: 'started'
        },

        /**
         * Deposit Currency
         */
        depositCurrency: {
            type: 'string',
            enum: ['BTC', 'BCH', 'ETH', 'LTC']
        },

        /**
         * Invoice #
         * DO NOT EXPOSE TO CLIENTS - USED TO CONFIRM CALLBACK VALIDITY
         */
        invoice: {
            type: 'string'
        },

        /**
         * Number of blockchain confirmations
         */
        confirmations: {
            type: 'string'
        },
        
        /**
         * Actual amount credited
         */
        credited: {
            type: 'string'
        },

        /**
         * Difference between deposit & actual
         */
        difference: {
            type: 'string'
        },

        /**
         * Actual Amount paid (price * quantity)
         */
        actualPaid: {
          type: 'string'
        }
    },

    /**
     * afterUpdate
     */
    afterUpdate: function(updatedRecord, cb) {
        if(updatedRecord.status && updatedRecord.status === 'completed' && updatedRecord.confirmations && parseFloat(updatedRecord.confirmations) === 1) {
            sails.log.debug("completed! attempting to send email with the following data model: " + JSON.stringify(updatedRecord));
            emailAPI.orderComplete(updatedRecord.userId, updatedRecord.depositAmount, updatedRecord.depositMethod, updatedRecord.depositCurrency, updatedRecord.credited, updatedRecord.difference);
        }
        cb();
    }
};

