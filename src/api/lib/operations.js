const mongoose = require('mongoose');
const md5 = require('md5');
const {Operation} = require('../models');

module.exports = {
  persist,
  getOperations,
  transform,
  aggregateByCategoryByDate,
  aggregateTotal,
};

/**
 * Return operation for user
 * @param user
 * @return {Promise<*>}
 */
async function getOperations(user) {
  const operations = await Operation.find({user: user.id}).lean().exec();
  return operations.map((operation) => {
    return transform(operation);
  })
}

/**
 * Persist many operations
 * @param user
 * @param operations
 * @return {Promise}
 */
async function persist(user, operations) {

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

  await Operation.insertMany(operationsToSave);
  return operationsToSave.map(operation => transform(operation));
}

/**
 * @param operation
 * @return {{date: *, id: *, label: *, debit: (*|$group.debit|{$sum}|number|NumberConstructor), credit: (*|$group.credit|{$sum}|number|NumberConstructor), category: *, user: *, tags: (*|*[]|string[]|string[]|string|*[])}}
 */
function transform(operation) {
  return {
    id: operation.id,
    label_str: operation.label_str,
    debit: operation.debit,
    credit: operation.credit,
    category: operation.category,
    date: operation.date,
    tags: operation.tags,
  }
}

function aggregateTotal(from, to, matches) {
  const request = [
    {
      "$match": {
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