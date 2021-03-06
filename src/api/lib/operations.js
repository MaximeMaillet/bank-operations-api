const mongoose = require('mongoose');
const md5 = require('md5');
const {Operation} = require('../models');
const {transform} = require('./transformers');

module.exports = {
  persist,
  validate,
  getOperations,
  persistMany,
  getOperationsFromDate,
  aggregateByCategoryByDate,
  aggregateTotal,
  getAggregateTotalRequest,
};


/**
 *
 * @param user
 * @param operation
 * @returns {Promise<{date: *, id: *, label: *, debit: (*|$group.debit|{$sum}|number|NumberConstructor), credit: (*|$group.credit|{$sum}|number|NumberConstructor), category: *, user: *, tags: (*|*[]|string[]|string)}|*>}
 */
async function persist(user, operation) {
  let operationsExists = null;
  const price = operation.credit ? operation.credit : operation.debit;

  if(operation.id) {
    operationsExists = await Operation.findOne({
      id: operation.id,
      user: user.id,
    });
  } else {
    operationsExists = await Operation.findOne({
      hash: md5(operation.label_raw+operation.date+price),
      user: user.id,
    });
  }

  if(!operation.label_raw) {
    operation.label_raw = operation.label;
  }

  if(operationsExists) {
    validate(operation);
    const newOperation = await Operation.updateOne({id: operationsExists.id}, operation, { new: true, runValidators: true });
    return transform(newOperation, 'Operation');
  }

  const ope = new Operation({
    ...operation,
    user: user.id,
    hash: md5(operation.label_raw+operation.date+price),
  });

  validate(ope);
  await ope.save();
  return transform(ope, 'Operation');
}

/**
 * @param user
 * @param operations
 * @returns {Promise<void>}
 */
async function persistMany(user, operations) {
  const errors = [];
  for(const i in operations) {
    try {
      await persist(user, operations[i]);
    } catch(e) {
      console.log(e)
      errors.push({
        operation: operations[i],
        errors: e,
      });
    }
  }

  if(errors.length > 0) {
    throw errors;
  }

  return operations;
}

/**
 * @param operation
 * @returns {null}
 */
function validate(operation) {
  const errors = {};

  if((!operation.credit && !operation.debit) || (operation.credit === 0 && operation.debit === 0)) {
    errors['credit'] = 'Credit is required';
    errors['debit'] = 'Debit is required';
  }

  if(operation instanceof mongoose.Model) {
    const mongoValidate = operation.validateSync();
    if(mongoValidate) {
      for(const i in mongoValidate.errors) {
        errors[i] = mongoValidate.errors[i].message;
      }
    }
  }

  if(Object.keys(errors).length > 0) {
    throw errors;
  }

  return null;
}


/**
 * Return operation for user
 * @param user
 * @param _query
 * @param dates
 * @param pagination
 * @return {Promise<*>}
 */
async function getOperations(user, {from, to}, {page, offset}, _query) {
  page = !page ? 0 : parseInt(page) - 1;
  offset = offset ? parseInt(offset) : 20;
  _query = _query || {};

  const query = {
    user: user.id,
    date: {
      '$gte': from,
      '$lt': to,
    },
    ..._query,
  };

  const operations = await Operation
    .find(query)
    .sort({date: 'desc'})
    .limit(offset)
    .skip(page * offset)
    .lean().exec();

  return {
    operations: await transform(operations, 'Operation'),
    pagination: await definePagination(query, page, offset)
  };
}


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
 * @deprecated
 * Persist many operations
 * @param user
 * @param operations
 * @return {Promise}
 */
async function persistManyLegacy(user, operations) {
  const operationsExists = (await Operation.find({
    hash: { $in: operations.map(operation => md5(operation.label+operation.date+(operation.credit ? operation.credit : operation.debit)))},
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
    const price = operations[i].credit ? operations[i].credit : operations[i].debit;
    const hash = md5(operations[i].label+operations[i].date+price);
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
