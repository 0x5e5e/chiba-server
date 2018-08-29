/**
 * Coin.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
const dataManager = require('../../core/data/datamanager.js');

module.exports = {

  attributes: {

    /**
     * User ID of owner
     */
    userId: {
      type: 'string',
      required: true
    },
     
    /**
     * Asset Code
     * e.g. "BTC"
     */
    assetCode: {
      type: 'string',
      required: true
    },
    
    /**
     * Coin Balance 
     */
    balance: {
      type: 'string',
      required: true
    },

    /**
     * Last Quoted Price
     * according to prices at purchase time 
     */
    lastQuotedPrice: {
      type: 'string'
    }
  }
};

