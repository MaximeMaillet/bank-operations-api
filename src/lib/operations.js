const mongoose = require('mongoose');
const {Operation} = require('../models');

function getOperations() {
  return new Promise((resolve, reject) => {
    mongoose.connect('mongodb://localhost/Banque');
    const db = mongoose.connection;
    db.on('error', (err) => reject(err));
    db.once('open', () => {
      console.log('Mongo connected');
      Operation.find({})
        .then((ope) => {
          resolve(ope);
        });
    });
  });
}

function persist(operations) {
  return new Promise((resolve, reject) => {
    console.log('Persist operations ...');
    mongoose.connect('mongodb://localhost/Banque');
    const db = mongoose.connection;
    db.on('error', (err) => reject(err));
    db.once('open', () => {
      console.log('Mongo connected');
      const opes = [];
      for(let i=0; i<operations.length; i++) {
        Operation.findOne({
          label: operations[i].label,
          date: operations[i].date,
        }, (err, result) => {
          if(err) {
            console.log(err);
          } else {
            if(!result) {
              opes.push(operations[i]);
            }
          }
        });
      }

      console.log('Waiting ...');
      setTimeout(() => {
        Operation.insertMany(opes)
          .then(() => {
            console.log(`${opes.length} documents persisted`);
            resolve(opes);
          })
          .catch((err) => {
            reject(err);
          });
      }, 1000);
    });
  });
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

module.exports = {
  persist,
  getOperations,
  aggregateByCategoryByDate,
  aggregateTotal
};
