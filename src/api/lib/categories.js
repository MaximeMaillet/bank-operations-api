const {Operation} = require('../models');

module.exports = {
  get,
};

async function get() {
  return Operation
    .find({})
    .distinct('category')
    .lean().exec();
}
