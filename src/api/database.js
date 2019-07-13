require('dotenv').config();
const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

module.exports = {
  connect,
};

async function connect() {
  const db = await mongoose.connect(`${process.env.MONGO_HOST}/Banque`, { useNewUrlParser: true });
  mongoose.set('useCreateIndex', true);
  autoIncrement.initialize(db);
}
