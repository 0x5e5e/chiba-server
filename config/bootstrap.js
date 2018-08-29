/**
 * For more information on bootstrapping, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.bootstrap.html
 */
const binance = require('../core/adapters/binance.js');
const dataManager = require('../core/data/datamanager.js');
const executionManager = require('../core/orders/execution.js');
const history = require('../core/portfolio/history.js');
const passport = require('../core/auth/passport.js');

module.exports.bootstrap = function(cb) { // TODO: rewrite using async/await 

    /**
     * Initialize Passport Auth
     */
    passport.initialize();

    /**
     * Load crypto data into memory
     */
    dataManager.initialize();

    /**
     * Initialize order execution engine
     */
    executionManager.start().then(() => {

        /**
         * Initialize portfolio value history 
         */
        history.start();

        User.update({email: 'benjche@gmail.com'}, {creditBalance: '5000.00'}).exec((err, _updatedUser) => {

        });

        cb(); // VERY IMPORTANT - MUST RETURN CALLBACK!
        
    }, (error) => {
        sails.log.error(error);
    }); 

};
