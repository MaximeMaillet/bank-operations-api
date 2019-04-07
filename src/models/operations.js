const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = new Schema({
  date: Date,
  label: String,
  label_str: String,
  debit: Number,
  credit: Number,
  category: String,
  tags: [String]
});