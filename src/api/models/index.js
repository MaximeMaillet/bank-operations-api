const mongoose = require('mongoose');

module.exports = {
  Operation: mongoose.model('Operation', require('./operations')),
  Label: mongoose.model('Label', require('./labels')),
  User: mongoose.model('User', require('./user')),
};