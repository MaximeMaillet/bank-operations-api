require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const uuid = require('uuid/v1');
const moment = require('moment');
const {Label} = require('../models');

let missings = [];

module.exports.read = (file, copy) => {
  return new Promise(async(resolve, reject) => {
    const operations = [];

    console.log('Load category');
    const categories = await loadCategory();

    let newFile = file;
    if(copy) {
      console.log('Start copy');
      newFile = `${process.env.STORAGE}/csv/${moment().format('YMMDD')}-${uuid()}.csv`;
      fs.createReadStream(file)
        .pipe(fs.createWriteStream(newFile))
      ;
    }

    console.log('Start reading');
    fs.createReadStream(newFile)
      .pipe(csv({
        raw: false,     // do not decode to utf-8 strings
        separator: ';', // specify optional cell separator
        quote: '"',     // specify optional quote character
        escape: '"',    // specify optional escape character (defaults to quote value)
        newline: '\n',  // specify a newline character
        strict: false    // require column length match headers length
      }))
      .on('data', (data) => {
        if(data.date) {
          const credit = data.credit ? data.credit.replace(/\s/g, '').replace(/,/g, '.') : 0;
          const debit = data.debit ? data.debit.replace(/\s/g, '').replace(/,/g, '.') : 0;
          const arrayDate = data.date.replace(/\s/g, '').split('/');
          if(arrayDate.length === 3) {
            operations.push({
              date: new Date(`${arrayDate[2]}-${arrayDate[1]}-${arrayDate[0]}`),
              label: data.libelle.replace(/\s/g, ''),
              debit: debit ? parseFloat(debit) : 0,
              credit: credit ? parseFloat(credit) : 0,
              category: findCategory(categories, data.libelle),
            });
          }
        }
      })
      .on('finish', () => {
        missings = operations.filter((acc) => acc.category === null).map((acc) => `${acc.date} : ${acc.label} - ${acc.debit}`);
        const realOperations = operations.filter((acc) => acc.category !== null);

        if(missings.length > 0) {
          console.log(`Missing labels : ${missings.length}`);
        }
        console.log(`Reading ${realOperations.length} operations`);
        resolve(realOperations);
      });
  });
};

module.exports.getMissings = () => {
  return missings;
};

function loadCategory() {
  return new Promise((resolve, reject) => {
    mongoose.connect('mongodb://localhost/Banque');
    const db = mongoose.connection;
    db.on('error', (err) => reject(err));
    db.once('open', () => {
      Label.find({}, (err, res) => {
        if(err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  });
}

function findCategory(categories, label) {
  for(let i=0; i<categories.length; i++) {
    for(let j=0; j<categories[i].match.length; j++) {
      if(label.replace(/\s/g, '').match(categories[i].match[j])) {
        return categories[i].label;
      }
    }
    const {keywords} = categories[i];
    if(keywords.length > 0) {
      const arrayLabel = cleanLabel(label);
      for(let j=0; j<arrayLabel.length; j++) {
        if(categories[i].keywords.indexOf(arrayLabel[j]) !== -1) {
          return categories[i].label;
        }
      }
    }
  }

  return null;
}

function cleanLabel(label) {
  return label.split(' ').map((str) => str.toLowerCase());
}