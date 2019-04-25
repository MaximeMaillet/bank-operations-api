const cors = require('cors');

const whiteList = ['http://localhost', 'http://localhost:3000']

module.exports = cors({
  origin: function(origin, callback) {

    if(!origin) return callback(null, true);
    if(whiteList.indexOf(origin) === -1){
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  exposedHeaders: ['Content-Type', 'Content-Length', 'X-Foo', 'X-Bar'],
});