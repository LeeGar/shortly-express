var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',
  hasTimeStamps: false,
  defaults: {
    visits: 0
  },
  initialize: function () {
    this.on('creating', function(model, attributes, options) {
      // console.log('what is attributes through models: ', model.attributes);
      bcrypt.genSalt(10, function(error, salt) {
        if (error) {
          return next(error);
        }
        bcrypt.hash(model.attributes.password, salt, null, function(error, hash) {
          if (error) {
            return next(error);
          }
          model.attributes.password = hash;
        });
      });
    });
  }
});


module.exports = User;