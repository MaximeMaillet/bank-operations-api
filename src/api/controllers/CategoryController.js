const {get} = require('../lib/categories');

module.exports = {
	getFromUser,
};

async function getFromUser(req, res, next) {
	try {
		const operations = await get();

		res.send(operations);
	} catch(e) {
		next(e);
	}
}