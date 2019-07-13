const database = require('../database');
const md5 = require('md5');

async function run() {
  try {
    await database.connect();
    const {Operation} = require('../models/index');
    const operations = await Operation.find({});
    const promises = [];
    for(const i in operations) {
      const price = operations[i].credit ? operations[i].credit : operations[i].debit;
      promises.push(Operation.updateOne({id: operations[i].id}, {hash: md5(operations[i].label_raw+operations[i].date+price)}));
    }

    await Promise.all(promises);
    console.log('done');
    process.exit();
  } catch(e) {
    console.log(e);
    process.exit()
  }
}

run();
