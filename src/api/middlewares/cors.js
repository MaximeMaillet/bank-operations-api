require('dotenv').config();
const cors = require('cors');
const whitelist = process.env.CORS_DOMAIN.split(',');

module.exports.apply = cors({
  origin: function(origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  allowedHeaders: ['Authorization', 'Content-Type', 'Origin', 'Referer', 'User-Agent', '*']
});
