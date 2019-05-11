require('dotenv').config();
const express = require('express');
const router = require('express-imp-router');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const autoIncrement = require('mongoose-auto-increment');

const app = express();
const cors = require('cors');
router(app);
router.enableDebug();

mongoose.connect(`${process.env.MONGO_HOST}/Banque`, { useNewUrlParser: true });
const db = mongoose.connection;
mongoose.set('useCreateIndex', true);
autoIncrement.initialize(db);

console.log(path.resolve('.')+'/src/front/build');

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

  const whitelist = process.env.CORS_DOMAIN.split(',');
  app.use(cors({
    origin: function(origin, callback) {
      if (!origin || whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    allowedHeaders: ['Authorization', 'Content-Type', 'Origin', 'Referer', 'User-Agent', '*']
  }));

  router.route([
    {
      controllers: `${path.resolve('.')}/src/api/controllers`,
      middlewares: `${path.resolve('.')}/src/api/middlewares`,
      routes: {
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
                  controllers: [require('./api/middlewares/upload').csv]
                }
              },
              '/import': {
                '_middleware_': {
                  controllers: ['authenticate#auth', require('./api/middlewares/upload').json]
                },
                post: 'OperationController#import'
              },
              '/:id(\\d+)': {
                _middleware_: {
                  controllers: ['authenticate#auth', 'binding#bindOperation', bodyParser.json()]
                },
                patch: 'OperationController#updateOne',
                get: 'OperationController#getOne',
                delete: 'OperationController#deleteOne',
                '/sub_operations': {
                  _middleware_: {
                    controllers: ['authenticate#auth', 'binding#bindOperation', bodyParser.json()]
                  },
                  post: 'SubOperationController#split'
                }
              }
            },
            '/categories': {
              '_middleware_': {
                controllers: ['authenticate#auth']
              },
              get: 'CategoryController#getFromUser'
            },
            '/statistics': {
              '_middleware_': {
                controllers: ['authenticate#auth']
              },
              get: 'StatisticsController#getStats'
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
        },
        '/': {
          '_static_': {
            'targets': ['src/front/build/'],
            'options': {}
          }
        },
      }
    }
  ]);

  app.listen(process.env.APP_PORT, () => {
    console.log(`listening on port ${process.env.APP_PORT}`);
  });
});