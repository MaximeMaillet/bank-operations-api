const moment = require('moment');


function sortByDate(collection, _last) {
  const collectionSorted = [];
  const last = _last || moment('2017-07-01');
  const today = moment();
  while(today > last) {
    collectionSorted.push({
      date: moment(last),
    });
    last.add(1, 'months');
  }

  for(let i=0; i<collection.length; i++) {
    for(let j=0; j<collectionSorted.length; j++) {
      const nowDate = moment(collectionSorted[j].date);
      const nextDate = collectionSorted[j+1] ? moment(collectionSorted[j+1].date) : moment();

      if(collection[i].date >= nowDate && collection[i].date < nextDate) {
        if(!collectionSorted[j][collection[i].category]) {
          collectionSorted[j][collection[i].category] = {
            credit: 0,
            debit: 0,
            label: [],
          };
        }

        collectionSorted[j][collection[i].category]['credit'] += collection[i].credit;
        collectionSorted[j][collection[i].category]['debit'] += collection[i].debit;
        collectionSorted[j][collection[i].category]['label'].push(`${collection[i].label} : \t${collection[i].debit} :: ${collection[i].credit}`);
      }
    }
  }

  return collectionSorted;
}

function showByDate(operations) {
  if(operations.length === 0) {
    console.log('No operations');
    return;
  }
  let total = 0;
  operations = sortByDate(operations);
  for(let i=0; i<operations.length; i++) {
    const {date, ...rest} = operations[i];
    const categories = Object.keys(rest);
    let subTotal = 0;

    console.log(date.format('D/M/Y'));

    for(let j=0; j<categories.length; j++) {
      subTotal += rest[categories[j]].credit - rest[categories[j]].debit;

      console.log(`${categories[j]} : ${rest[categories[j]].credit - rest[categories[j]].debit}`);
      for(let t=0; t<rest[categories[j]].label.length; t++) {
        console.log(`\t ${rest[categories[j]].label[t]}`);
      }
    }
    console.log(`SubTotal : ${subTotal}\n`);
    total += subTotal;
  }

  console.log(`Total : ${total}`);
}

module.exports.byDate = {
  sort: sortByDate,
  show: showByDate,
};