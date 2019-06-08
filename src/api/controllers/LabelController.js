const fs = require('fs');
const path = require('path');
const {Label} = require('../models');
const {transform} = require('../lib/transformers');

module.exports = {
  getAllForUser,
  getOneForUser,
  putForUser,
  patchForUser,
  deleteForUser,
  importForUser,
};

/**
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
async function getOneForUser(req, res, next) {
  try {
    res.send((await transform(req.bind, 'Label')));
  } catch (e) {
    next(e);
  }
}

/**
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
async function getAllForUser(req, res, next) {
  try {
    const labels = await Label.find({
      user: req.user.id,
    });

    res.send((await transform(labels, 'Label')));
  } catch (e) {
    next(e);
  }
}

/**
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
async function putForUser(req, res, next) {
  try {
    const label = new Label({
      ...req.body,
      user: req.user.id,
    });
    await label.save();
    res.send(label);
  } catch (e) {
    next(e);
  }
}

/**
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
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
  } catch (e) {
    next(e);
  }
}

/**
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
async function deleteForUser(req, res, next) {
  try {
    await Label.remove({id: req.bind.id});
    res.send({
      status: 'success'
    });
  } catch (e) {
    next(e);
  }
}

/**
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
async function importForUser(req, res, next) {
  try {
    if(!req.file) {
      return res.status(422).send({
        errors: [{
          field: 'json',
          message: 'File is required'
        }]
      });
    }

    const labels = JSON.parse(fs.readFileSync(`${path.resolve('.')}/${req.file.path}`));
    const labelsReturn = [];
    for(const i in labels) {
      try {
        const label = new Label({
          user: req.user.id,
          label: labels[i].label,
          match: labels[i].match,
          keywords: labels[i].keywords,
        });
        await label.save();
        labelsReturn.push(label);
      } catch(e) {}
    }

    res.send(labelsReturn);
  } catch(e) {
    next(e);
  }
}
