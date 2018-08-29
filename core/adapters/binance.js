/**
 * Binance API wrapper 
 */
let binance = require('binance-api-node').default;

let binanceClient = null;
let binanceWSClient = null; 

module.exports = {
    /**
     * Initialize Binance API connection 
     */
    initialize: function() {
        /**binanceClient = binance();
        //binanceClient = binance({apiKey: sails.config.binanceKey, apiSecret: sails.config.binanceSecret}); 

        binanceClient.time().then(time => sails.log.debug("BINANCE TIME: " + time));  
        binanceWSClient = binanceClient.ws.depth('ETHBTC', depth => {
            console.log(depth); 
        });*/
    },

    /**
     * 
     */

}
