const {Operation} = require('../models');

module.exports.run = (operations) => {
  return new Promise((resolve, reject) => {
    console.log('Persist operations ...');
    const mongoose = require('mongoose');
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
};