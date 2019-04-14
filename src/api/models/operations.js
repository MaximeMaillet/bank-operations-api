const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const autoIncrement = require('mongoose-auto-increment');

const operationSchema = new Schema({
  date: Date,
  hash: String,
  id: { type: Number, default: 0 },
  user: { type: Number, ref: 'User' },
  label: String,
  label_str: String,
  debit: Number,
  credit: Number,
  category: String,
  tags: [String]
});

operationSchema.plugin(autoIncrement.plugin, { model: 'Operations', field: 'id' });

module.exports = operationSchema;