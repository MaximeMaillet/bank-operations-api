const {persist, getOperations} = require('./src/lib/operations');
const bankAccount = require('./src/lib/readBankAccount');
const Sort = require('./src/lib/sort');

const copyCSV = true;
const fileArgs = process.argv[2];
let csvFile = 'compte.csv';

if(fileArgs.startsWith('--file')) {
  const arrayArgs = fileArgs.split('=');
  csvFile = arrayArgs[1];
}

launch()
  .then(() => {
    process.exit();
  })
  .catch((err) => {
    console.log(err);
    process.exit();
  });

async function launch() {
  console.log(`Load ${csvFile}`);
  try {
    const operations = await bankAccount.read(csvFile, copyCSV);
    await persist(operations);
    Sort.byDate.show((await getOperations()));
    const missings = bankAccount.getMissings();
    if(missings.length > 0) {
      console.log(missings);
    }
    return true;
  } catch(e) {
    console.log(e);
    return false;
  }
}