const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const autoincrement = require('mongoose-auto-increment');

const labelSchema = new Schema({
  id: { type: Number, default: 0 },
  label:  String,
  match: [],
  keywords: [],
  user: {
    type: Number,
    ref: 'User',
    required: [true, 'User is required']
  },
});

labelSchema.plugin(autoincrement.plugin, { model: 'Labels', field: 'id', startAt: 1 });

module.exports = labelSchema;
