const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  id: { type: Number, default: 0 },
  username: String,
  password: String,
});

userSchema.plugin(autoIncrement.plugin, { model: 'Users', field: 'id' });

module.exports = userSchema;