/**
 * For more information on the blueprint API, check out:
 * http://sailsjs.org/#!/documentation/reference/blueprint-api
 *
 * For more information on the settings in this file, see:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.blueprints.html
 */

module.exports.blueprints = {

  // auto-generated routes for custom controller
  actions: false,

  // auto-generated RESTful routes for models 
  rest: false,

  // CRUD from url args
  shortcuts: false,

  // mount path for routes for namespaced API 
  prefix: '',
  restPrefix: '',

  // pluralize controller names   
  pluralize: false,

  // populate by model association.  caution: possible performance impact
  populate: false,

  // Model.watch() on find(), findOne()
  autoWatch: true,

  // limit to records retrieved by find() 
  defaultLimit: 30

};
