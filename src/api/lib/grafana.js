const moment = require('moment');

module.exports = {
  formatFromAggregateByCategoryAndDate,
  formatFromAggregateTotal,
};

function formatFromAggregateByCategoryAndDate(from, to, data) {
  const categories = {};
  const arrayDates = getAllDates(from, to);

  for(let i in data) {
    if(!categories[data[i].category]) {
      categories[data[i].category] = [];
    }

    categories[data[i].category].push(data[i]);
  }

  const targetsResponse = [];
  for(let i in categories) {
    let datapoints = [];
    let categoryName = '';

    for(let k in arrayDates) {
      let value = 0;

      for (let j in categories[i]) {
        let itemDate = moment(categories[i][j].ts);
        if(itemDate.isSame(arrayDates[k], 'month') && itemDate.isSame(arrayDates[k], 'year')) {
          categoryName = categories[i][j].category.charAt(0).toUpperCase() + categories[i][j].category.slice(1).toLowerCase();

          value = Math.floor(categories[i][j].credit) - Math.floor(categories[i][j].debit);
        }
      }
      datapoints.push([value, arrayDates[k].valueOf()]);
    }

    targetsResponse.push({
      "target": categoryName,
      datapoints,
    })
  }

  return targetsResponse;
}

function formatFromAggregateTotal(from, to, data, isSeparated) {
  const datapointsTotal = [];
  const datapointsCredit = [];
  const datapointsDebit = [];
  for(let i in data) {
    if(isSeparated) {
      datapointsCredit.push([
        data[i].credit,
        new Date(data[i].ts).getTime(),
      ]);
      datapointsDebit.push([
        data[i].debit,
        new Date(data[i].ts).getTime(),
      ])
    } else {
      datapointsTotal.push([
        data[i].credit - data[i].debit,
        new Date(data[i].ts).getTime(),
      ])
    }
  }

  if(isSeparated) {
    return [
      {'target': 'Dépenses', 'datapoints': datapointsDebit},
      {'target': 'Gains', 'datapoints': datapointsCredit}
      ];
  }

  return {
    "target": "Total",
    datapointsTotal
  }
}

function getAllDates(from, to) {
  const arrayDates = [];
  let dateFrom = moment(from);
  const dateTo = moment(to);

  do {
    arrayDates.push(dateFrom.clone());
    dateFrom = dateFrom.add(1, 'M');
  } while(dateFrom < dateTo);

  return arrayDates;
}