const mongoose = require('mongoose');
const md5 = require('md5');
const {Operation} = require('../models');

module.exports = {
  persistMany,
  persist,
  getOperations,
  getOperationsFromDate,
  transform,
  aggregateByCategoryByDate,
  aggregateTotal,
  getAggregateTotalRequest,
};

/**
 * Return operation for user
 * @param user
 * @param dates
 * @param pagination
 * @return {Promise<*>}
 */
async function getOperations(user, {from, to}, pagination) {
  pagination.page = !pagination.page ? 0 : parseInt(pagination.page) - 1;
  pagination.offset = pagination.offset ? parseInt(pagination.offset) : 20;

  const total = await Operation.countDocuments({
    user: user.id,
    date: {
      '$gte': from,
      '$lt': to,
    }
  });
  const lastPage = Math.floor(total/pagination.offset);
  if(pagination.page < 0) {
    pagination.page = 0;
  }

  const operations = await Operation
    .find({
      user: user.id,
      date: {
        '$gte': from,
        '$lt': to,
      }
    })
    .sort({date: 'desc'})
    .limit(pagination.offset)
    .skip(pagination.page*pagination.offset)
    .lean().exec();

  return {
    operations: operations.map((operation) => {
      return transform(operation);
    }),
    pagination: {
      total,
      page: pagination.page+1,
      pageSize: pagination.offset,
      lastPage: lastPage+1,
    }
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
      })
    }
  }

  for(let i in operationsToSave) {
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
    for(let i in mongoValidate.errors) {
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
 * @return {{date: *, id: *, label: *, debit: (*|$group.debit|{$sum}|number|NumberConstructor), credit: (*|$group.credit|{$sum}|number|NumberConstructor), category: *, user: *, tags: (*|*[]|string[]|string[]|string|*[])}}
 */
function transform(operation) {
  return {
    id: operation.id,
    label: operation.label,
    debit: operation.debit,
    credit: operation.credit,
    category: operation.category,
    date: operation.date,
    tags: operation.tags,
  }
}

function getAggregateTotalRequest(from, to, matches) {
  return [
    {
      "$match": {
        ...matches,
        "date": {
          "$gte": new Date(from),
          "$lt": new Date(to)
        }
      }
    },
    {"$group" : {
        "_id" : {"$dateFromParts": {"year": {"$year": "$date"}, "month": {"$month": "$date"}}},
        "debit" : {"$sum" : "$debit"},
        "credit": {"$sum" : "$credit"}
      }},
    {"$project": {
        "_id": 0,
        "ts": "$_id",
        "debit": 1,
        "credit": 1
      }},
    {"$sort": {"ts": 1}}
  ];
}

function aggregateTotal(from, to, matches) {
  const request = getAggregateTotalRequest(from, to, matches);

  return doAggregateRequest(request);
}

function aggregateByCategoryByDate(from, to, matches) {
  const request = [
    {
      "$match": {
        ...matches,
        "date": {
          "$gte": new Date(from),
          "$lt": new Date(to)
        }
      }
    },
    {"$group" : {
      "_id" : {
        "ts": {"$dateFromParts": {"year": {"$year": "$date"}, "month": {"$month": "$date"}}},
        "category": "$category"
      },
      "debit" : {"$sum" : "$debit"},
      "credit": {"$sum" : "$credit"}
    }},
    {"$project": {
      "_id": 0,
      "ts": "$_id.ts",
      "debit": 1,
      "credit": 1,
      "category": "$_id.category",
    }},
    {"$sort": {"category": 1, "ts": 1}}
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
  })
}