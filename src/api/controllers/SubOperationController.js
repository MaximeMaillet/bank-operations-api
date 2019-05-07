const {SubOperation} = require('../models');
const {transform} = require('../lib/transformers');

module.exports = {
  split,
};

async function split(req, res, next) {
  try {
    const bodySubOperations = req.body;
    const total = [0, 0];

    for(const i in req.bind.subs) {
      total[0] += req.bind.subs[i].debit;
      total[1] += req.bind.subs[i].credit;
    }

    bodySubOperations.map((item) => {
      total[0] += parseFloat(item.debit);
      total[1] += parseFloat(item.credit);
    });

    if(
      (req.bind.debit && req.bind.debit !== total[0]) ||
      (req.bind.credit && req.bind.credit !== total[1])
    ) {
      return res.status(422).send({
        message: 'Sum of money not corresponding'
      });
    }

    for(const i in bodySubOperations) {
      const newSubOperation = new SubOperation({
        ...bodySubOperations[i],
        operation: req.bind.id,
      });
      await newSubOperation.save();
      req.bind.subs.push(newSubOperation);
    }

    res.send((await transform(req.bind, 'Operation')));
  } catch(e) {
    next(e);
  }
}