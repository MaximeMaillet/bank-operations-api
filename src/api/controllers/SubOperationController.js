const {SubOperation} = require('../models');
const {transform} = require('../lib/transformers');

module.exports = {
  split,
};

async function split(req, res, next) {
  try {
    const {subs} = req.body;
    let total = 0;

    subs.map((item) => {
      total += parseFloat(item.total);
    });

    if(
      (req.bind.operation.debit && req.bind.operation.debit > 0 && req.bind.operation.debit !== total) ||
      (req.bind.operation.credit && req.bind.operation.credit > 0 && req.bind.operation.credit !== total)
    ) {
      return res.status(422).send({
        message: 'Sum of money not corresponding'
      });
    }

    await SubOperation.find({operation: req.bind.operation.id}).remove().exec();
    req.bind.operation.subs = [];

    const errors = {};

    for(let i=0; i<subs.length;i++) {
      try {
        const newSubOperation = new SubOperation({
          ...subs[i],
          operation: req.bind.operation.id,
        });
        await newSubOperation.save();
        req.bind.operation.subs.push(newSubOperation);
      } catch(e) {
        if(e.name === 'ValidationError') {
          errors[i] = {};
          const errs = Object.values(e.errors);
          for(let j=0; j<errs.length; j++) {
            errors[i][errs[j].path] = errs[j].message;
          }
        } else {
          throw e;
        }
      }
    }

    if(Object.values(errors).length > 0) {
      return res.status(422).send({
        message: 'Form unprocessable',
        errors: {
          subs: errors
        }
      });
    }

    res.send((await transform(req.bind, 'Operation')));
  } catch(e) {
    next(e);
  }
}