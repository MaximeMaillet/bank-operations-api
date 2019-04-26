const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const autoIncrement = require('mongoose-auto-increment');
const moment = require('moment');

const operationSchema = new Schema({
  date: {
    type: Date,
    required: [true, 'Date is required'],
    validate: {
      validator: (value) => {
        return moment(value).isValid();
      },
      message: props => 'Date is invalid'
    }
  },
  hash: String,
  id: { type: Number, default: 0 },
  user: {
    type: Number,
    ref: 'User',
    required: [true, 'User is required']
  },
  label_raw: String,
  label: {
    type: String,
    required: [true, 'Label is required'],
  },
  debit: Number,
  credit: Number,
  category: {
    type: String,
    required: [true, 'Category is required']
  },
  tags: [String]
});

operationSchema.plugin(autoIncrement.plugin, { model: 'Operations', field: 'id' });

module.exports = operationSchema;