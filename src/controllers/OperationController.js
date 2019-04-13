const bankAccount = require('../lib/readBankAccount');
const {persist, getOperations, transform} = require('../lib/operations');
const fs = require('fs');
const path = require('path');

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
    const operations = (JSON.parse(fs.readFileSync(`${path.resolve('.')}/${req.file.path}`)))
      .map((operation) => {
        return {
          ...operation,
          label_str: operation.label,
          user: req.user.id,
        };
      });
    const saved = await persist(req.user, operations);
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
    const operations = await getOperations(req.user);

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

    const {label_str, credit, debit, tags, date, category} = req.body;
    req.bind.label_str = label_str ? label_str : req.bind.label_str;
    req.bind.credit = credit ? credit : req.bind.credit;
    req.bind.debit = debit ? debit : req.bind.debit;
    req.bind.tags = tags ? tags : req.bind.tags;
    req.bind.category = category ? category : req.bind.category;
    req.bind.date = date ? date : req.bind.date;
    req.bind.save();
    res.send(req.bind);
  } catch(e) {
    next(e);
  }
}

async function addOne(req, res, next) {
  try {
    const {label, label_str, credit, debit, tags, date, category} = req.body;
    const operation = await persist(req.user, [{
      label,
      label_str,
      credit,
      debit,
      tags,
      category,
      date
    }]);
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