/**
 * Utility Functions 
 */
const _ = require('lodash');

module.exports = {
    /**
     * Validates email input & checks for equality match
     * @returns false -> invalid or unauthorized 
     * TODO: test this
     */
    validAuthorizedEmail: function(emailA, emailB) {
        if(!_.isNil(emailA) && typeof emailA === 'string' && !_.isNil(emailB) && typeof emailB === 'string') {
            // passed validation, lets check permissions now
            if(emailA.toLowerCase() === emailB.toLowerCase()) {
                return true;
            }
        } 
        return false;
    },


}