const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = new Schema({
  label:  String,
  match: [],
});