require('dotenv').config();
const express = require('express');
const router = require('express-imp-router');
const bodyParser = require('body-parser');
const path = require('path');
const database = require('./api/database');

const app = express();
router(app);
router.enableDebug();

async function run() {
  try {
    await database.connect();
    console.log('Mongoose connection OK');

    router.route([
      {
        controllers: `${path.resolve('.')}/src/api/controllers`,
        middlewares: `${path.resolve('.')}/src/api/middlewares`,
        routes: {
          '/api': {
            [router.IMP.MIDDLEWARE]: [
              {
                controllers: ['cors#apply', bodyParser.json()],
                level: router.MIDDLEWARE.LEVEL.GLOBAL,
                inheritance: router.MIDDLEWARE.INHERITANCE.DESC,
              }
            ],
            '/users': {
              [router.IMP.MIDDLEWARE]: [
                {
                  controllers: ['authenticate#auth'],
                  method: [router.METHOD.GET, router.METHOD.PATCH],
                  inheritance: router.MIDDLEWARE.INHERITANCE.DESC,
                }
              ],
              put: 'UserController#create',
              get: 'UserController#getMy',
              patch: 'UserController#update',
              '/login': {
                post: 'UserController#login',
              },
              '/operations': {
                [router.IMP.MIDDLEWARE]: [
                  {
                    controllers: ['authenticate#auth'],
                    inheritance: router.MIDDLEWARE.INHERITANCE.DESC,
                  },
                ],
                get: 'OperationController#getFromUser',
                post: 'OperationController#addOne',
                put: {
                  [router.IMP.MIDDLEWARE]: {
                    controllers: [require('./api/middlewares/upload').csv]
                  },
                  controller: 'OperationController',
                  action: 'importCsv',
                },
                '/import': {
                  [router.IMP.MIDDLEWARE]: {
                    controllers: [require('./api/middlewares/upload').json]
                  },
                  post: 'OperationController#import'
                },
                '/:id(\\d+)': {
                  [router.IMP.MIDDLEWARE]: {
                    controllers: ['binding#bindOperation'],
                    inheritance: router.MIDDLEWARE.INHERITANCE.DESC,
                  },
                  patch: 'OperationController#updateOne',
                  get: 'OperationController#getOne',
                  delete: 'OperationController#deleteOne',
                  '/split': {
                    post: 'OperationController#split'
                  }
                },
                '/missings': {
                  get: 'OperationController#getMissings'
                }
              },
              '/categories': {
                [router.IMP.MIDDLEWARE]: [
                  {
                    controllers: ['authenticate#auth'],
                    inheritance: router.MIDDLEWARE.INHERITANCE.DESC,
                  },
                ],
                get: 'CategoryController#getFromUser'
              },
              '/statistics': {
                [router.IMP.MIDDLEWARE]: [
                  {
                    controllers: ['authenticate#auth'],
                    inheritance: router.MIDDLEWARE.INHERITANCE.DESC,
                  },
                ],
                get: 'StatisticsController#getStats'
              },
              '/labels': {
                [router.IMP.MIDDLEWARE]: {
                  controllers: ['authenticate#auth', require('./api/middlewares/upload').json],
                  method: router.METHOD.POST,
                },
                post: 'LabelController#importForUser',
                get: 'LabelController#getAllForUser',
                put: 'LabelController#putForUser',
                '/:id': {
                  [router.IMP.MIDDLEWARE]: [{
                    controllers: ['binding#bindLabel']
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
  } catch(e) {
    console.log('Fail connect to database');
    console.log(e);

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
  }
}

run();
