const csv = require('csv-parser')
const fs = require('fs')
const moment = require('moment');
const persistOperations = require('./src/lib/persistOperations');
const bankAccount = require('./src/lib/readBankAccount');
const Sort = require('./src/lib/sort');

launch()
  .then(() => {
    process.exit();
  })
  .catch((err) => {
    console.log(err);
    process.exit();
  });

async function launch() {
  const operations = await bankAccount.read('compte.csv', false);
  await persistOperations.run(operations);
  Sort.byDate.show(operations);
}