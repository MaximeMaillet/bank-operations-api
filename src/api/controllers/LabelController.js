const {Label} = require('../models');
const {transform} = require('../lib/transformers');

module.exports = {
	getAllForUser,
	getOneForUser,
	putForUser,
	patchForUser,
	deleteForUser,
};

async function getOneForUser(req, res, next) {
	try{
		res.send((await transform(req.bind, 'Label')));
	} catch(e) {
		next(e);
	}
}

async function getAllForUser(req, res, next) {
	try{
		const labels= await Label.find({
			user: req.user.id,
		});

		res.send((await transform(labels, 'Label')));
	} catch(e) {
		next(e);
	}
}

async function putForUser(req, res, next) {
	try {
		const label = new Label({
			...req.body,
			user: req.user.id,
		});
		await label.save();
		res.send(label);
	} catch(e) {
		next(e);
	}
}

async function patchForUser(req, res, next) {
	try {
		const newLabel = await Label.updateOne(
			{
				id: req.bind.id
			},
			{
				...req.bind,
				...req.body
			},
			{
				new: true,
				runValidators: true
			}
		);

		res.send((await transform(newLabel, 'Label')));
	} catch(e) {
		console.log(e)
		next(e);
	}
}

async function deleteForUser(req, res, next) {
	try {
		await Label.remove({id: req.bind.id});
		res.send({
			status: 'success'
		})
	} catch(e) {
		next(e);
	}
}
