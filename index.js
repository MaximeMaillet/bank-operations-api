// const {persist, getOperations} = require('./src/lib/operations');
// const bankAccount = require('./src/lib/readBankAccount');
// const Sort = require('./src/lib/sort');

// const copyCSV = true;
// const fileArgs = process.argv[2];
// let csvFile = 'compte.csv';
//
// if(fileArgs.startsWith('--file')) {
//   const arrayArgs = fileArgs.split('=');
//   csvFile = arrayArgs[1];
// }
var fs = require('fs');

function processFile(inputFile) {
  return new Promise((resolve, reject) => {
    const readline = require('readline'),
      instream = fs.createReadStream(inputFile),
      outstream = new (require('stream'))(),
      rl = readline.createInterface(instream, outstream);

    const ope = [];

    rl.on('line', (line) => {
      const json = JSON.parse(line);
      ope.push({
        label: json.label,
        debit: json.debit,
        credit: json.credit,
        category: json.category,
        date: json.date.$date,
      });
    });

    rl.on('close', () => {
      resolve(ope);
    });
  });
}
processFile('backups/banque-operations.json')
  .then((ope) => {
    fs.writeFileSync('backups/operations.json', JSON.stringify(ope));
  });

// launch()
//   .then(() => {
//     process.exit();
//   })
//   .catch((err) => {
//     console.log(err);
//     process.exit();
//   });
//
// async function launch() {
//   console.log(`Load ${csvFile}`);
//   try {
//     const operations = await bankAccount.read(csvFile, copyCSV);
//     await persist(operations);
//     Sort.byDate.show((await getOperations()));
//     const missings = bankAccount.getMissings();
//     if(missings.length > 0) {
//       console.log(missings);
//     }
//     return true;
//   } catch(e) {
//     console.log(e);
//     return false;
//   }
// }