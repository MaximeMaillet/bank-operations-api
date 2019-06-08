const bankAccount = require('../lib/readBankAccount');
const {persistMany, validate, persist, getOperations} = require('../lib/operations');
const {add} = require('../lib/history');
const {transform} = require('../lib/transformers.js');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const {Operation} = require('../models/index');

module.exports = {
  import: _import,
  importCsv,
  getFromUser,
  getOne,
  updateOne,
  deleteOne,
  addOne,
  getMissings,
  split,
};

/**
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
async function getMissings(req, res, next) {
  try {
    let {from, to, page, offset} = req.query;
    if(!to && req.user.lastOperationDate) {
      to = moment(req.user.lastOperationDate).add(1, 'day').startOf('day').format('YYYY-MM-DD[T]HH:mm:ss');
    }

    if(!from && req.user.firstOperationDate) {
      from = moment(req.user.firstOperationDate).startOf('day').format('YYYY-MM-DD[T]HH:mm:ss');
    }

    if(!offset) {
      offset = 20;
    }

    if(!page) {
      page = 1;
    }

    const operations = await getOperations(req.user, {from, to}, {page, offset}, {category: '_none_'});

    res.send(operations);
  } catch(e) {
    next(e);
  }
}

/**
 * @param req
 * @param res
 * @param next
 * @return {Promise<*>}
 */
async function importCsv(req, res, next) {
  try {
    if(!req.file) {
      return res.status(422).send({message: 'No CSV file founded'});
    }

    const {missingOperations, verifiedOperations} = await bankAccount.read(req.file.path);
    console.log(missingOperations);
    // const operations = verifiedOperations.concat(missingOperations)
    //   .map((operation) => {
    //     return {
    //       ...operation,
    //       user: req.user.id
    //     };
    //   });

    // await persistMany(req.user, verifiedOperations);
    res.send(verifiedOperations);
  } catch(e) {
    // console.log(e)
    res.status(422).send({
      message: 'Form is unprocessable',
      errors: e,
    })
  }
}

/**
 * Import massive JSON file
 * @param req
 * @param res
 * @param next
 * @return {Promise<void>}
 * @private
 */
async function _import(req, res, next) {
  try {
    if(!req.file) {
      return res.status(422).send({
        errors: [{
          field: 'json',
          message: 'File is required'
        }]
      });
    }

    const operations = (JSON.parse(fs.readFileSync(`${path.resolve('.')}/${req.file.path}`)))
      .map((operation) => {
        return {
          ...operation,
          label_str: operation.label,
          user: req.user.id,
        };
      });
    const saved = await persistMany(req.user, operations);
    res.send(saved);
  } catch(e) {
    next(e);
  }
}

/**
 * Get operations from user
 * @param req
 * @param res
 * @param next
 * @return {Promise<void>}
 */
async function getFromUser(req, res, next) {
  try {
    let {from, to, page, offset} = req.query;
    if(!to && req.user.lastOperationDate) {
      to = moment(req.user.lastOperationDate).add(1, 'day').startOf('day').format('YYYY-MM-DD[T]HH:mm:ss');
    }

    if(!from && req.user.firstOperationDate) {
      from = moment(req.user.firstOperationDate).startOf('day').format('YYYY-MM-DD[T]HH:mm:ss');
    }

    if(!offset) {
      offset = 20;
    }

    if(!page) {
      page = 1;
    }

    const operations = await getOperations(req.user, {from, to}, {page, offset});

    res.send(operations);
  } catch(e) {
    next(e);
  }
}

/**
 * @param req
 * @param res
 * @param next
 * @return {Promise<*>}
 */
async function getOne(req, res, next) {
  try {
    res.send(req.bind.operation);
  } catch(e) {
    next(e);
  }
}

/**
 * @param req
 * @param res
 * @return {Promise<*>}
 */
async function updateOne(req, res) {
  try {
    if(req.user.id !== req.bind.operation.user) {
      return res.status(403).send({
        message: 'You don\'t have permission'
      });
    }

    const {label, credit, debit, tags, date, category, id} = req.body;
    const operation = await persist(req.user, {
      ...req.bind.operation,
      label,
      credit,
      debit,
      tags,
      date,
      category,
      id});
    res.send(operation);
  } catch(e) {
    res.status(422).send({
      message: 'Form unprocessable',
      errors: e
    });
  }
}

/**
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
async function addOne(req, res) {
  try {
    const {label, credit, debit, tags, date, category} = req.body;
    const operation = await persist(req.user, {
      label,
      label_raw: label,
      credit,
      debit,
      tags,
      category,
      date
    });
    res.send(operation);
  } catch(e) {
    res.status(422).send({
      message: 'Form unprocessable',
      errors: e
    });
  }
}

/**
 * @param req
 * @param res
 * @param next
 * @return {Promise<*>}
 */
async function deleteOne(req, res, next) {
  try {
    if(req.bind.operation.user !== req.user.id) {
      return res.status(403).send({
        message: 'You don\'t have permission'
      });
    }

    await Operation.deleteOne({id: req.bind.operation.id});
    res.send({success:true});
  } catch(e) {
    next(e);
  }
}

/**
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
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

    let label = '';

    for(const i in subs) {
      const newOperation = await persist(req.user, {
        date: subs[i].date,
        label: subs[i].label,
        credit: req.bind.operation.credit ? subs[i].total : 0,
        debit: req.bind.operation.debit ? subs[i].total : 0,
        tags: subs[i].tags,
        category: req.bind.operation.category,
      });
      label += `[${newOperation.id}] ${newOperation.label} with ${newOperation.credit}€ / ${newOperation.debit}€ && `;
    }

    await Operation.find({id: req.bind.operation.id}).remove().exec();

    await add(
      req.bind.operation,
      'split',
      `${req.bind.operation.label} with ${req.bind.operation.credit}€ / ${req.bind.operation.debit}€`,
      label
    );

    res.send();
  } catch(e) {
    next(e);
  }
}
