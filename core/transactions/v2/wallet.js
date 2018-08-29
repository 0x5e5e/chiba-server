/**
 * Wallet.js
 * Manages cryptocurrency wallets
 * CURRENTLY UNUSED
 */
const bitcoin_core = require('bitcoin-core');

const bitcoinOpts = {
    // agentOptions: { }
    host: 'localhost',
    network: 'testnet',
    username: '',
    password: '',
    ssl: {
        enabled: false,
        strict: false
    },
    timeout: 20000, // request timeout (ms)
    //version: '', // enable strict version testing 
};
const bitcoinManager;

module.exports = {

    /**
     * Initialize Wallet Managers
     */
    initialize: function() {

        // BITCOIN
        bitcoinManager = new bitcoin_core(bitcoinOpts); 

        // BITCOIN CASH

        // ETHEREUM

        // LITECOIN

        return;
    },

    /**
     * Find or Create a stored address for a specific cryptocurrency
     */
    findOrCreate: async function(userId, type) {
        if(!type) {
            throw new Error('type is null');
        }
        switch(type) {
            case 'bitcoin':
                if(!bitcoinManager) {
                    throw new Error('bitcoin manager not initalized'); 
                }

            break;

            default: // no matches 
                throw new Error('wallet type: ' + type + ' is invalid');
            break;
        }
    },


    
}