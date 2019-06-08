const {History} = require('../models');

module.exports = {
	add,
};

async function add(Operation, type, before, after) {
	const history = new History({
		operation: Operation.id,
		type,
		before,
		after,
	});

	await history.save();
	return history;
}
