/**
 * Withdrawal.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

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
         * Withdrawal Amt (USD)
         */
        withdrawalAmount: {
            type: 'string',
            required: true
        },

        /**
         * Withdrawal Method
         */
        withdrawalMethod: {
            type: 'string',
            required: true,
            enum: ['BTC', 'BCH', 'ETH']
        },

        /**
         * Withdrawal Status
         */
        status: {
            type: 'string',
            required: true,
            enum: ['pending', 'canceled', 'completed'],
            defaultsTo: 'pending'
        }
    }
};

