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
      var salt = bcrypt.genSaltSync(10);
      var hash = bcrypt.hashSync(model.attributes.password, salt);
      model.set('salt', salt);
      model.set('password', hash);
    });
  }
});

module.exports = User;
