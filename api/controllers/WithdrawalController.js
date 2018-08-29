/**
 * WithdrawalController
 *
 * @description :: Server-side logic for managing Withdrawals
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const emailAPI = require('../../core/notifications/email.js');

module.exports = {

    /**
     * Return balance available for withdrawal
     */
    availableBalance: function(req, res) {
        const email = req.user.email;

        if (!email) {
            return res.serverError();
        }

        User.findOne({ email: email }).exec((err, _user) => {
            if(err || !_user) {
                sails.log.error("Error finding user: availableBalance");
                return res.serverError();
            }
            const creditBalance = _user.creditBalance;

            // find all completed credit card deposits
            /**Deposit.find({ depositMethod: 'creditcard', status: 'completed' }).exec((err, _deposits) => {
                if (err) {
                    sails.log.error("Error finding completed CC deposits");
                    return res.serverError();
                }
            });*/

            return res.json({ balance: creditBalance });
        });

    },

    /**
     * Create Withdrawal request 
     */
    createWithdrawal: function(req, res) {
        const email = req.user.email;
        const amtArg = req.param('withdrawalamount');
        const methodArg = req.param('withdrawalmethod');

        if (!email || !amtArg || !methodArg) {
            return res.serverError();
        }

        const withdrawalAmount = parseFloat(amtArg);
        const withdrawalMethod = methodArg;

        if(withdrawalAmount < 0) {
            return res.serverError();
        }

        User.findOne({ email: email }).exec((err, _user) => {
            if (err || !_user) {
                sails.log.error("Error finding user: availableBalance");
                return res.serverError();
            }
            const withdrawalRequest = {
                userId: _user.email,
                withdrawalAmount: withdrawalAmount,
                withdrawalMethod: withdrawalMethod,
                status: 'pending'
            };
            Withdrawal.create(withdrawalRequest).exec((err, _createdWithdrawal) => {
                if(err || !_createdWithdrawal) {
                    sails.log.error("Failed to create withdrawal for user: " + _user.email);
                    return res.serverError();
                }
                emailAPI.withdrawalRequest(_createdWithdrawal.userId, _createdWithdrawal.withdrawalAmount, _createdWithdrawal.withdrawalMethod);
                return res.ok();
            });
        });
    }
};

