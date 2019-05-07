const mongoose = require('mongoose');
const md5 = require('md5');
const {Operation, SubOperation} = require('../models');
const {transform} = require('./transformers');

module.exports = {
  persistMany,
  persist,
  getOperations,
  getOperationsFromDate,
  aggregateByCategoryByDate,
  aggregateTotal,
  getAggregateTotalRequest,
};

const definePagination = async(query, page, offset) => {
  const total = await Operation.countDocuments(query);

  const lastPage = Math.floor(total/offset);
  if(page < 0) {
    page = 0;
  }

  return {
    total,
    page: page+1,
    pageSize: offset,
    lastPage: lastPage+1,
  };
};

/**
 * Return operation for user
 * @param user
 * @param dates
 * @param pagination
 * @return {Promise<*>}
 */
async function getOperations(user, {from, to}, {page, offset}) {
  page = !page ? 0 : parseInt(page) - 1;
  offset = offset ? parseInt(offset) : 20;

  const query = {
    user: user.id,
    date: {
      '$gte': from,
      '$lt': to,
    }
  };

  const operations = await Operation
    .find(query)
    .sort({date: 'desc'})
    .limit(offset)
    .skip(page * offset)
    .lean().exec();

  for(const i in operations) {
    const subOperations = await SubOperation.find({operation: operations[i].id});
    operations[i].subs = subOperations;
  }

  return {
    operations: await transform(operations, 'Operation'),
    pagination: await definePagination(query, page, offset)
  };
}

async function getOperationsFromDate(user, {from, to}) {
  const operations = await Operation
    .find({
      user: user.id,
      date: {
        '$gte': new Date(from),
        '$lt': new Date(to)
      }
    })
    .sort({date: 'desc'})
    .lean().exec();

  return operations.map((operation) => {
    return transform(operation);
  });
}

/**
 * Persist many operations
 * @param user
 * @param operations
 * @return {Promise}
 */
async function persistMany(user, operations) {

  const operationsExists = (await Operation.find({
    hash: { $in: operations.map(operation => md5(operation.label+operation.date))},
    user: user.id,
  })
    .lean()
    .exec())
    .map(operation => operation.hash);

  const lastOperation = await Operation.findOne().sort({ id: 'desc' });
  let id = 0;
  if(lastOperation) {
    id = lastOperation.id;
  }

  const operationsToSave = [];
  for(const i in operations) {
    const hash = md5(operations[i].label+operations[i].date);
    if(operationsExists.indexOf(hash) === -1) {
      id++;
      operationsToSave.push({
        ...(transform(operations[i])),
        id,
        hash,
        user: user.id,
      });
    }
  }

  for(const i in operationsToSave) {
    await persist(user, operationsToSave[i]);
  }
  return operationsToSave.map(operation => transform(operation));
}

/**
 *
 * @param user
 * @param operation
 * @returns {Promise<{date: *, id: *, label: *, debit: (*|$group.debit|{$sum}|number|NumberConstructor), credit: (*|$group.credit|{$sum}|number|NumberConstructor), category: *, user: *, tags: (*|*[]|string[]|string)}|*>}
 */
async function persist(user, operation) {
  const operationsExists = await Operation.findOne({
    hash: md5(operation.label+operation.date),
    user: user.id,
  });

  if(operationsExists) {
    return transform(operationsExists);
  }

  if(!operation.label_raw) {
    operation.label_raw = operation.label;
  }

  const ope = new Operation({
    ...operation,
    user: user.id,
    hash: md5(operation.label_raw+operation.date),
  });
  const mongoValidate = ope.validateSync();
  if(mongoValidate) {
    const errors = [];
    for(const i in mongoValidate.errors) {
      errors.push({
        field: i,
        message: mongoValidate.errors[i].message,
      });
    }
    throw errors;
  }
  await ope.save();
  return transform(ope);
}

/**
 * @param operation
 * @param subOperations
 * @return {{date: *, id: *, label: *, debit: (*|$group.debit|{$sum}|number|NumberConstructor), credit: (*|$group.credit|{$sum}|number|NumberConstructor), category: *, user: *, tags: (*|*[]|string[]|string[]|string|*[])}}
 */
function transformLegacy(operation, subOperations) {
  const returnOperation = {
    id: operation.id,
    label: operation.label,
    debit: operation.debit,
    credit: operation.credit,
    category: operation.category,
    date: operation.date,
    tags: operation.tags,
    sub: [],
  };

  if(subOperations) {
    for(const i in subOperations) {
      returnOperation.sub.push({
        label: subOperations[i].label,
        date: subOperations[i].date,
        debit: subOperations[i].debit,
        credit: subOperations[i].credit,
      });
    }
  }

  return returnOperation;
}

function getAggregateTotalRequest(from, to, matches) {
  return [
    {
      '$match': {
        ...matches,
        'date': {
          '$gte': new Date(from),
          '$lt': new Date(to)
        }
      }
    },
    {'$group' : {
      '_id' : {'$dateFromParts': {'year': {'$year': '$date'}, 'month': {'$month': '$date'}}},
      'debit' : {'$sum' : '$debit'},
      'credit': {'$sum' : '$credit'}
    }},
    {'$project': {
      '_id': 0,
      'ts': '$_id',
      'debit': 1,
      'credit': 1
    }},
    {'$sort': {'ts': 1}}
  ];
}

function aggregateTotal(from, to, matches) {
  const request = getAggregateTotalRequest(from, to, matches);

  return doAggregateRequest(request);
}

function aggregateByCategoryByDate(from, to, matches) {
  const request = [
    {
      '$match': {
        ...matches,
        'date': {
          '$gte': new Date(from),
          '$lt': new Date(to)
        }
      }
    },
    {'$group' : {
      '_id' : {
        'ts': {'$dateFromParts': {'year': {'$year': '$date'}, 'month': {'$month': '$date'}}},
        'category': '$category'
      },
      'debit' : {'$sum' : '$debit'},
      'credit': {'$sum' : '$credit'}
    }},
    {'$project': {
      '_id': 0,
      'ts': '$_id.ts',
      'debit': 1,
      'credit': 1,
      'category': '$_id.category',
    }},
    {'$sort': {'category': 1, 'ts': 1}}
  ];

  return doAggregateRequest(request);
}

/**
 * Do mongoose request for aggregate
 * @param request
 * @return {Promise}
 */
function doAggregateRequest(request) {
  return new Promise((resolve, reject) => {
    mongoose.connect('mongodb://localhost/Banque');
    const db = mongoose.connection;
    db.on('error', (err) => reject(err));
    db.once('open', () => {
      Operation.aggregate(request)
        .then((data) => {
          resolve(data);
        });
    });
  });
}