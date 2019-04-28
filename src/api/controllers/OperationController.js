const bankAccount = require('../lib/readBankAccount');
const {persistMany, persist, getOperations, getOperationsFromDate, transform} = require('../lib/operations');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

module.exports = {
  add,
  import: _import,
  getFromUser,
  getOne,
  updateOne,
  deleteOne,
  addOne,
};

/**
 * @param req
 * @param res
 * @param next
 * @return {Promise<*>}
 */
async function add(req, res, next) {
  try {
    if(!req.file) {
      return res.status(422).send({message: 'No CSV file founded'});
    }

    const {missingOperations, verifiedOperations} = await bankAccount.read(req.file.path, false);
    const operations = verifiedOperations.concat(missingOperations)
      .map((operation) => {
        return {
          ...operation,
          user: req.user.id
        };
      });
    const saved = await persist(req.user, operations);
    res.send(saved);
  } catch(e) {
    next(e);
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
      })
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
    if(req.query.from || req.query.to) {
      console.log('get');
      console.log((new Date(req.query.from)));
      console.log((new Date(req.query.to)));
      const operations = await getOperationsFromDate(req.user, {
        from: req.query.from,
        to: req.query.to,
      });

      return res.send(operations);
    }

    const operations = await getOperations(req.user, {
      page: req.query.page,
      offset: req.query.offset,
    });

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
    res.send(transform(req.bind));
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
async function updateOne(req, res, next) {
  try {
    if(req.user.id !== req.bind.user) {
      return res.status(403).send({
        message: 'You don\'t have permission'
      })
    }

    const {label, credit, debit, tags, date, category} = req.body;
    req.bind.label = label ? label : req.bind.label;
    req.bind.credit = credit ? credit : req.bind.credit;
    req.bind.debit = debit ? debit : req.bind.debit;
    req.bind.tags = tags ? tags : req.bind.tags;
    req.bind.category = category ? category : req.bind.category;
    req.bind.date = date ? moment(date) : moment(req.bind.date);
    req.bind.save();
    res.send(transform(req.bind));
  } catch(e) {
    console.log(e);
    next(e);
  }
}

/**
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
async function addOne(req, res, next) {
  try {
    const {label, credit, debit, tags, date, category} = req.body;
    let operation = {};
    try {
      operation = await persist(req.user, {
        label,
        label_raw: label,
        credit,
        debit,
        tags,
        category,
        date
      });
    } catch(e) {
      return res
        .status(422)
        .send({
          message: 'Form is invalid',
          errors: e
        });
    }

    res.send(operation);
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
async function deleteOne(req, res, next) {
  try {
    if(req.bind.user !== req.user.id) {
      return res.status(403).send({
        message: 'You don\'t have permission'
      })
    }

    req.bind.remove();
    res.send({success:true});
  } catch(e) {
    next(e);
  }
}