require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const uuid = require('uuid/v1');
const moment = require('moment');
const {Label} = require('../models');

let missings = [];
const operations = [];
let categories = [];

module.exports.getMissings = () => {
  return missings;
};

module.exports.read = async(file, shouldCopy) => {
  console.log('Load category');
  categories = await loadCategory();
  let fileNameToRead = file;

  if(shouldCopy) {
    console.log('Start copy');
    fileNameToRead = `${process.env.STORAGE}/_csv/${moment().format('YMMDD')}-${uuid()}.csv`;
    await copy(file, fileNameToRead);
  }

  return readFile(fileNameToRead);
};

/**
 * Copy file
 * @param file
 * @param newFile
 * @return {Promise}
 */
function copy(file, newFile) {
  return new Promise((resolve, reject) => {
    fs.copyFile(file, newFile, (err) => {
      if(err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Load category from DB
 * @return {Promise}
 */
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

function readFile(file) {
  return new Promise((resolve, reject) => {
    console.log(`Start reading on ${file}`);
    fs.createReadStream(file)
      .pipe(csv({
        raw: false,     // do not decode to utf-8 strings
        separator: ';', // specify optional cell separator
        quote: '"',     // specify optional quote character
        escape: '"',    // specify optional escape character (defaults to quote value)
        newline: '\n',  // specify a newline character
        strict: false,    // require column length match headers length
        headers: ['date', 'libelle', 'debit', 'credit']
      }))
      .on('data', (data) => {
        const arrayDate = data.date.replace(/\s/g, '').split('/');
        const date = new Date(`${arrayDate[2]}-${arrayDate[1]}-${arrayDate[0]}`);

        if(!isNaN(date.getTime())) {
          const credit = data.credit ? data.credit.replace(/\s/g, '').replace(/,/g, '.') : 0;
          const debit = data.debit ? data.debit.replace(/\s/g, '').replace(/,/g, '.') : 0;
          operations.push({
            date: new Date(`${arrayDate[2]}-${arrayDate[1]}-${arrayDate[0]}`),
            label: data.libelle.replace(/\s/g, ''),
            label_str: cleanLibelle(data.libelle),
            debit: debit ? parseFloat(debit) : 0,
            credit: credit ? parseFloat(credit) : 0,
            category: findCategory(categories, data.libelle),
            category_2: findCategory(categories, cleanLibelle(data.libelle)),
          });
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
      })
      .on('error', (err) => {
        reject(err);
      })
    ;
  });
}

function cleanLibelle(str) {

  const uselessWords = ['paiement', 'par', 'carte'];
  const details = str.split(' ');
  const arrayStr = [];
  for(let i=0; i<details.length-1; i++) {
    details[i] = details[i].replace(/\s/g, '');

    if(!details[i] || details[i] === '') {
      continue;
    }

    if(details[i].match(/[0-9]{2}\/[0-9]{2}/)) {
      continue;
    }

    if(uselessWords.indexOf(details[i].toLowerCase()) !== -1) {
      continue;
    }

    details[i] = details[i].replace(/\r?\n|\r/g, '');
    arrayStr.push(details[i]);
  }

  return arrayStr.join(' ');
}