require('dotenv').config();
const bcrypt = require('bcrypt');
const {User} = require('../models');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

module.exports = {
  create,
  login,
  update,
  getMy,
};

async function create(req, res, next) {
  try {
    const {username, password} = req.body;
    const hash = bcrypt.hashSync(username+password, 10);
    let user = await User.findOne({
      username,
    });

    if(user) {
      return res.status(422).send({
        message: 'This user already exists',
      });
    }

    user = new User({
      username,
      password: hash,
    });

    await user.save();

    const privateKey = fs.readFileSync(`${path.resolve('.')}/keys/auth`);
    const token = jwt.sign({
      data: {username},
      exp: Math.floor(Date.now() / 1000) + (60 * 60),
    }, privateKey, { algorithm: 'RS256'});

    res.send({
      id: user.id,
      username,
      token
    });
  } catch(e) {
    next(e);
  }
}

async function login(req, res, next) {
  try {
    const {username, password} = req.body;
    const hash = bcrypt.hashSync(username+password, 10);
    const user = await User.findOne({
      username,
    });

    if(!user) {
      return res.status(422).send({
        message: 'This user does not exists',
      });
    }


    if(!bcrypt.compareSync(username+password, hash)) {
      return res.status(422).send({
        message: 'Password fail',
      });
    }

    const privateKey = fs.readFileSync(`${path.resolve('.')}/keys/auth`);
    const token = jwt.sign({
      data: {username},
      exp: Math.floor(Date.now() / 1000) + (60 * 60),
    }, privateKey, { algorithm: 'RS256'});

    res.send({
      username,
      token
    });
  } catch(e) {
    next(e);
  }
}

async function update(req, res, next) {
  try {
    res.status(403).send({
      message: 'This feature does not exists yet',
    });
  } catch(e) {
    next(e);
  }
}

async function getMy(req, res, next) {
  try {
    res.send({
      id: req.user.id,
      username: req.user.username,
    });
  } catch(e) {
    next(e);
  }
}