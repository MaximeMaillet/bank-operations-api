const mongoose = require('mongoose');
const {Operation} = require('../models');

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

function getOperations() {
  return new Promise((resolve, reject) => {
    mongoose.connect('mongodb://localhost/Banque');
    const db = mongoose.connection;
    db.on('error', (err) => reject(err));
    db.once('open', () => {
      console.log('Mongo connected');
      Operation.find({})
        .then((ope) => {
        console.log(ope.length);
          resolve(ope);
        });
    });
  });
}

module.exports = {
  persist,
  getOperations,
};
