const {getAggregateTotalRequest} = require('../lib/operations');
const {Operation} = require('../models');
const moment = require('moment');

module.exports = {
	getStats,
};

async function getStats(req, res, next) {
	try {
		let {from, to} = req.query;

		if(!from) {
			from = moment(req.user.firstOperationDate).startOf('month').format('YYYY-MM-DD[T]HH:mm:ss')
		}

		if(!to) {
			to = moment(req.user.lastOperationDate).add(1, 'months').startOf('month').format('YYYY-MM-DD[T]HH:mm:ss');
		}

		const data = await Operation.aggregate([
			{
				$match: {
					user: req.user.id,
					date: {
						'$gte': moment(from).toDate(),
						'$lt': moment(to).toDate()
					}
				}
			},
			{
				$group: {
					_id: null,
					credit:   { $sum: "$credit" },
					debit: { $sum: "$debit" }
				}
			}
		]).exec();

		if(!data || data.length === 0) {
			return res.send({total: 0, debit: 0, credit: 0});
		}

		const debit = Math.round((data[0].debit * -1)*100)/100;
		const credit = Math.round((data[0].credit)*100)/100;

		res.send({
			debit,
			credit,
			total: Math.round((debit+credit)*100)/100,
		});
	} catch(e) {
		console.log(e);
		next(e);
	}
}