const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = new Schema({
  date: Date,
  label: String,
  debit: Number,
  credit: Number,
  category: String,
});