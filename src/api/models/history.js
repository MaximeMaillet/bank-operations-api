const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment');

const operationSchema = new Schema({
	date: {
		type: Date,
		required: [true, 'Date is required'],
		default: moment(),
		validate: {
			validator: (value) => {
				return moment(value).isValid();
			},
			message: props => 'Date is invalid'
		}
	},
	type: String,
	operation: {
		type: Number,
		ref: 'Operation',
		required: [true, 'Operation is required']
	},
	before: String,
	after: String,
});

module.exports = operationSchema;
