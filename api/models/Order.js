/**
 * Order.js
 *
 * @description :: Buy/Sell Orders 
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    /**
     * User ID of order creator 
     */
    userId: {
      type: 'string',
      required: true
    },

    /**
     * Order Direction (Buy/Sell)
     */
    orderDirection: {
      type: 'string',
      enum: ['buy', 'sell'],
      required: true
    },

    /**
     * Order Type 
     */
    orderType: {
      type: 'string',
      enum: ['market', 'limit', 'stoploss'],
      required: true
    },

    /**
     * Order Amount 
     */
    orderAmount: {
      type: 'string',
      required: true 
    },

    /**
     * Asset Code 
     */
    assetCode: {
      type: 'string',
      required: true 
    },

    /**
     * Order Completion status flag 
     */
    orderStatus: {
      type: 'string',
      enum: ['pending', 'canceled', 'processing', 'completed'],
      required: true
    },

    /**
     * Executed Price
     */
    executedPrice: {
      type: 'string'
    },

    /**
     * Executed Amount
     */
    executedAmount: {
      type: 'string'
    }
  }
};

