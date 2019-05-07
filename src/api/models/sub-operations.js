const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment');

const operationSchema = new Schema({
  operation: {
    type: Number,
    ref: 'Operation',
    required: [true, 'Operation is required'],
  },
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
  label: {
    type: String,
    required: [true, 'Label is required'],
  },
  debit: Number,
  credit: Number,
  tags: [String],
});

module.exports = operationSchema;