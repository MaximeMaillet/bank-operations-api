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

mongoose.connect(`${process.env.MONGO_HOST}/Banque`, { useNewUrlParser: true });
const db = mongoose.connection;
mongoose.set('useCreateIndex', true);
autoIncrement.initialize(db);

db.on('error', (err) => {
  console.log('Fail connecting to mongoDB');
  console.log(err);

  router.route([
    {
      controllers: `${path.resolve('.')}/src/api/controllers`,
      routes: {
        '/': {
          get: (req, res) => {
            res.send({message: 'API is not running'});
          }
        }
      }
    }
  ]);

  app.listen(process.env.APP_PORT, () => {
    console.log(`listening on port ${process.env.APP_PORT}`);
  });
});

db.once('open', () => {
  console.log('Mongoose connection OK');

  router.route([
    {
      controllers: `${path.resolve('.')}/src/api/controllers`,
      middlewares: `${path.resolve('.')}/src/api/middlewares`,
      routes: {
        '/api': {
          '_middleware_': [
            {
              controllers: ['cors#apply', bodyParser.json()],
              level: router.MIDDLEWARE_LEVEL.GLOBAL,
              inheritance: 'descending',
            }
          ],
          '/users': {
            '_middleware_': [
              {
                controllers: ['authenticate#auth'],
                method: [router.METHOD.GET, router.METHOD.PATCH],
              }
            ],
            put: 'UserController#create',
            get: 'UserController#getMy',
            patch: 'UserController#update',
            '/login': {
              post: 'UserController#login',
            },
            '/operations': {
              '_middleware_': [
                {
                  controllers: ['authenticate#auth'],
                  inheritance: 'descending',
                },
              ],
              get: 'OperationController#getFromUser',
              post: 'OperationController#addOne',
              put: {
                controller: 'OperationController',
                action: 'importCsv',
                '_middleware_': {
                  controllers: [require('./api/middlewares/upload').csv]
                }
              },
              '/import': {
                '_middleware_': {
                  controllers: [require('./api/middlewares/upload').json]
                },
                post: 'OperationController#import'
              },
              '/:id(\\d+)': {
                _middleware_: {
                  controllers: ['binding#bindOperation']
                },
                patch: 'OperationController#updateOne',
                get: 'OperationController#getOne',
                delete: 'OperationController#deleteOne',
                '/sub_operations': {
                  _middleware_: {
                    controllers: ['binding#bindOperation']
                  },
                  post: 'SubOperationController#split'
                }
              },
              '/missings': {
                get: 'OperationController#getMissings'
              }
            },
            '/categories': {
              '_middleware_': [
                {
                  controllers: ['authenticate#auth'],
                  inheritance: 'descending',
                },
              ],
              get: 'CategoryController#getFromUser'
            },
            '/statistics': {
              '_middleware_': [
                {
                  controllers: ['authenticate#auth'],
                  inheritance: 'descending',
                },
              ],
              get: 'StatisticsController#getStats'
            },
            '/labels': {
              '_middleware_': [{
                controllers: ['authenticate#auth']
              }],
              get: 'LabelController#getAllForUser',
              put: 'LabelController#putForUser',
              '/:id': {
                '_middleware_': [{
                  controllers: ['authenticate#auth', 'binding#bindLabel']
                }],
                get: 'LabelController#getOneForUser',
                patch: 'LabelController#patchForUser',
                delete: 'LabelController#deleteForUser',
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

  app.listen(process.env.APP_PORT, () => {
    console.log(`listening on port ${process.env.APP_PORT}`);
  });
});

