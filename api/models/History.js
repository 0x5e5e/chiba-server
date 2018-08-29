/**
 * History.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    /**
     * User ID
     */
    userId: {
      type: 'string',
      required: true
    },

    /**
     * Current Portfolio Value
     */
    portfolioValue: {
      type: 'string',
      required: true
    },

    /**
     * Current Credit Balance 
     */
    creditBalance: {
      type: 'string',
      required: true
    },

    /**
     * Current Portfolio
     */
    portfolio: {
      type: 'array'
    }

  }
};

