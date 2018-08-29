/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#!/documentation/concepts/Routes/RouteTargetSyntax.html
 */
const dataManager = require('../core/data/datamanager.js');

module.exports.routes = {

    /**
     * Authentication
     * NO AUTHENTICATION
     */
    'POST /login': 'AuthController.login',
    'POST /signup': 'AuthController.signup',
    'GET /verification/:code': 'AuthController.verification',
    'POST /resend': 'AuthController.resendVerification',

    /**
     * User profile 
     */
    'GET /user': 'UserController.getUser',

    /**
     * Credit Balance 
     */
    'GET /credit': 'UserController.getUserCreditBalance',

    /**
     * User Watchlist
     */
    'POST /updatewatchlist': 'UserController.updateWatchlist',

    /**
     * Currency List Data 
     * NO AUTHENTICATION
     */
    //'GET /coindata': 'DataController.getOfferingListData',
    'GET /volumedata': 'DataController.getVolumeData',
    'GET /toplist': 'DataController.getToplist',

    /**
     * Orders
     */
    'GET /order': 'OrderController.getOrders',
    'GET /orderstatus': 'OrderController.getOrder',
    'POST /order': 'OrderController.createOrder',
    'PUT /order': 'OrderController.cancelOrder',

    /**
     * Portfolio History
     */
    'GET /history': 'HistoryController.getHistory',

    /**
     * Deposits
     */
    'GET /deposit': 'DepositController.getDeposits',
    'GET /depositadmin': function(req, res) {
      let query = req.query;
      Deposit.find(query).exec((err, _deposits) => {
        return res.json(_deposits);
      });
    },
    'POST /callback/:order': 'DepositController.callback',
    'POST /deposit': 'DepositController.createDeposit',
    'POST /paybear/callback/:order': 'DepositController.callback',
    'GET /paybear/currencies': 'DepositController.getCurrencies',
    'GET /paybear/status': 'DepositController.status',
    
    /**
     * Withdrawals
     */
    'GET /availablebalance': 'WithdrawalController.availableBalance',
    'POST /withdrawal': 'WithdrawalController.createWithdrawal'
};
