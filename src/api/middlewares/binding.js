const {User, Operation} = require('../models');

module.exports = {
  bindUser,
  bindOperation,
};

async function bindOperation(req, res, next) {
  try {
    const operation = await Operation.findOne({id: req.params.id});
    if(!operation) {
      return res.status(404).send({
        message: 'This operation does not exists'
      });
    }

    req.bind = operation;
    next();
  } catch(e) {
    res.status(422).send({
      message: e.message,
    });
  }
}

async function bindUser(req, res, next) {
  try {
    const user = await User.findOne({id: req.params.id});
    if(!user) {
      return res.status(404).send({
        message: 'This user does not exists'
      });
    }

    req.bind = user;
    next();
  } catch(e) {
    res.status(422).send({
      message: e.message,
    });
  }
}