const {persist, getOperations} = require('./src/lib/operations');
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
  const operations = await bankAccount.read('compte.csv', true);
  await persist(operations);
  Sort.byDate.show((await getOperations()));
}