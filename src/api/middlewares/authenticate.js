const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const {User, Operation} = require('../models');

module.exports = {
  auth,
};

async function auth(req, res, next) {
  try {
    if(!req.headers.authorization) {
      throw new Error('No authorization header');
    }

    const auth = req.headers.authorization.split(' ');
    if(auth[0] !== 'Bearer') {
      throw new Error('No Bearer founded');
    }

    const cert = fs.readFileSync(`${path.resolve('.')}/keys/auth.pub`);
    const decode = await jwt.verify(auth[1], cert, { algorithms: ['RS256'] });
    const dbUser = await User.findOne({
      username: decode.data.username,
    });

    const firstOperation = await Operation.findOne({user: dbUser.id}, {date: 1}).sort({date: 'asc'});
    const lastOperation = await Operation.findOne({user: dbUser.id}, {date: 1}).sort({date: 'desc'});

    req.user = {
      id: dbUser.id,
      username: dbUser.username,
      firstOperationDate: firstOperation ? firstOperation.date : null,
      lastOperationDate: lastOperation ? lastOperation.date : null
    };

    next();

  } catch(e) {
    res.status(401).send({
      message: 'You are not authorized',
      debug: e.message,
    });
  }
}