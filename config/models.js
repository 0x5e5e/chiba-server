/**
 * Default model configuration
 * (sails.config.models)
 *
 * Unless you override them, the following properties will be included
 * in each of your models.
 *
 * For more info on Sails models, see:
 * http://sailsjs.org/#!/documentation/concepts/ORM
 */

module.exports.models = {

    // default connection (see connections.js)
    //connection: 'postgreSQL',
    connection: 'mongoDb',
    //connection: 'localDiskDb',

    // migration strategy - https://sailsjs.com/documentation/concepts/models-and-orm/model-settings
    migrate: 'safe'

};
