require('dotenv').config();
const express = require('express');
const router = require('express-imp-router');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const autoIncrement = require('mongoose-auto-increment');

const app = express();
router(app);
router.enableDebug();

mongoose.connect(`${process.env.MONGO_HOST}/Banque`);
const db = mongoose.connection;
autoIncrement.initialize(db);

db.on('error', (err) => {
  console.log('Fail connecting to mongoDB');
  console.log(err);

  router.route([
    {
      routes: {
        '/': {
          get: (req, res) => {
            res.send('API is not running');
          }
        }
      }
    }
  ]);

  app.listen(3000, () => {
    console.log('listening on port 3000!');
  });
});

db.once('open', () => {
  console.log('Mongoose connection OK');

  router.route([
    {
      controllers: `${path.resolve('.')}/src/controllers`,
      middlewares: `${path.resolve('.')}/src/middlewares`,
      routes: {
        '/': {
          get: (req, res) => {
            res.send('is running');
          }
        },
        '/api': {
          '/users': {
            '_middleware_': [
              {
                method: router.METHOD.ALL,
                controllers: [bodyParser.json()]
              },
              {
                controllers: ['authenticate#auth'],
                method: [router.METHOD.GET, router.METHOD.PATCH],
              }
            ],
            put: 'UserController#create',
            get: 'UserController#getMy',
            patch: 'UserController#update',
            '/login': {
              post: {
                controller: 'UserController',
                action: 'login',
                _middleware_: {
                  controllers: [bodyParser.json()]
                },
              },
            },
            '/operations': {
              '_middleware_': {
                controllers: ['authenticate#auth', bodyParser.json()]
              },
              get: 'OperationController#getFromUser',
              post: 'OperationController#addOne',
              put: {
                controller: 'OperationController',
                action: 'add',
                '_middleware_': {
                  controllers: [require('./middlewares/upload').csv]
                }
              },
              '/import': {
                '_middleware_': {
                  controllers: ['authenticate#auth', require('./middlewares/upload').json]
                },
                post: 'OperationController#import'
              },
              '/:id(\\d+)': {
                _middleware_: {
                  controllers: ['authenticate#auth', 'binding#bindOperation', bodyParser.json()]
                },
                patch: 'OperationController#updateOne',
                get: 'OperationController#getOne',
                delete: 'OperationController#deleteOne'
              }
            }
          },
        },
        '/graph': {
          '/search': {
            post: 'GraphController#search',
          },
          '/query': {
            post: 'GraphController#query',
          },
          '/annotations': {
            post: 'GraphController#annotations'
          }
        }
      }
    }
  ]);

  app.listen(3000, () => {
    console.log('listening on port 3000!');
  });
});