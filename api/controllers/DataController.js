/**
 * Data endpoints with no authentication
 */
const dataManager = require('../../core/data/datamanager.js');

module.exports = {
    /**
     * Get Offering list
     */
    getOfferingListData: function(req, res) {
        return res.json(dataManager.getOfferingListData()); 
    },

    /**
     * Get Volume data
     */
    getVolumeData: function(req, res) {
        return res.json(dataManager.getVolumeData());
    },

    /**
     * Get Toplist
     */
    getToplist: function(req, res) {
        let filterType = req.param('filter');
        if (!filterType) {
            return res.serverError();
        }
        return res.json(dataManager.getToplist(filterType));
    }
}