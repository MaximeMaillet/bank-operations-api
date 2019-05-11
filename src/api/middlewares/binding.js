const {User, Operation, SubOperation} = require('../models');
const {transform} = require('../lib/transformers');

module.exports = {
  bindUser,
  bindOperation,
};

async function bindOperation(req, res, next) {
  try {
    const operation = await Operation.findOne({id: req.params.id});
    const subOperations = await SubOperation.find({operation: req.params.id});

    if(!operation) {
      return res.status(404).send({
        message: 'This operation does not exists'
      });
    }

    req.bind = {
      operation: await transform(operation, 'Operation'),
      model: operation,
    };

    if(subOperations) {
      req.bind.operation.subs = await transform(subOperations, 'SubOperation');
    }

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