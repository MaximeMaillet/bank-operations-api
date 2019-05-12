require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const {Label} = require('../models');
const moment = require('moment');

let categories = [];

/**
 * Read CSV file
 * @param file
 * @return {Promise<*|Promise<any>>}
 */
module.exports.read = async(file) => {
  categories = await loadCategory();
  console.log(categories)
  return readFile(file);
};

/**
 * Load category from DB
 * @return {Promise}
 */
function loadCategory() {
  return Label.find({});
}

/**
 * Find category
 * @param categories
 * @param label
 * @return {null|*}
 */
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

  return '_none_';
}

/**
 * @param label
 * @return {string[]}
 */
function cleanLabel(label) {
  return label.split(' ').map((str) => str.toLowerCase());
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    console.log(`Start reading on ${file}`);
    const operations = [];
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
        const regex = new RegExp(/^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/i);
        if(regex.test(data.date)) {
          const date = moment(data.date, ['DD-MM-YYYY']);
          if(date.isValid()) {
            const credit = data.credit ? data.credit.replace(/\s/g, '').replace(/,/g, '.') : 0;
            const debit = data.debit ? data.debit.replace(/\s/g, '').replace(/,/g, '.') : 0;
            operations.push({
              date: date.toDate(),
              label: data.libelle,
              label_raw: data.libelle.replace(/\s/g, ''),
              debit: debit ? parseFloat(debit) : 0,
              credit: credit ? parseFloat(credit) : 0,
              category: findCategory(categories, data.libelle),
            });
          }
        }
      })
      .on('finish', () => {
        const missingOperations = operations
          .filter((operation) => operation.category === null)
          .map((operation) => `${operation.date} : ${operation.label} - ${operation.debit}`);
        const verifiedOperations = operations;//.filter((operation) => operation.category !== null);

        resolve({missingOperations, verifiedOperations});
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