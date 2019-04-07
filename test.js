const OAuth = require('oauth');
const request = require('request');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const qs = require('querystring')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//
// const baseURL = 'https://apisandbox.openbankproject.com';
// const request_data = {
//   url: `${baseURL}/oauth/initiate`,
//   method: 'POST',
//   consumer: {
//     key: 'zv0u5253hk12blnt3gxfzz4nop5y25unagtrdyy1',
//     secret: 'iichucmcqozgofosiprcsztt1jhcwqlzl4c3tpwo\n'
//   },
//   data: { oauth_callback: 'oob',  },
// };
// const request_info = {
//   url_request_token:  `${baseURL}/oauth/initiate`,
//   url_authenticate: `${baseURL}/oauth/authorize`
// };


const baseURL = 'https://www.creditagricolestore.fr';

const request_info = {
  callback: 'oob',
  url_request_token:  `${baseURL}/castore-oauth/resources/1/oauth/get_request_token`,
  url_authenticate: `${baseURL}/castore‐data‐provider/authentification`
};

const request_data = {
  method: 'POST',
  consumer: {
    key: 'https://www.creditagricolestore.fr/castore-oauth/resources/1/oauth/consumer/7dc89c222f6b461f80bd26c6fd9f3591',
    secret: 'cb65b64fa26a487699d21c644cd567b6'
  },
  data: { oauth_callback: request_info.callback,  },
};



let oauthData = {};

app.get('/', (req, res) => {
  res.send('<html>Coucou : <a href="/connect">Connect</a></html>')
});

app.get('/auth', (req, res) => {
  console.log(req.body);
  res.send('AUTH');
});

app.get('/connect', (req, res) => {
  const oauth = new OAuth.OAuth(request_info.url_request_token, '', request_data.consumer.key, request_data.consumer.secret, '1.0', true, 'HMAC-SHA1', 50, {});

  console.log('PHASE 1 : start');
  console.log(request_info.url_request_token);

  oauth.post(
    request_info.url_request_token,
    '',
    '',
    function (e, data, response){

      const result = {};
      const parameters = data.split('&');
      for(let i in parameters) {
        let _r = parameters[i].split('=');
        result[_r[0]] = _r[1];
      }

      oauthData = {
        ...oauthData,
        ...result,
      };

      console.log('PHASE 1 END : Get request token');
      console.log(result);


      console.log('PHASE 2 Start : ask to user for auth');
      let url = `${request_info.url_authenticate}?${qs.stringify({
        oauth_token: result.oauth_token,
        oauth_callback: request_info.callback
      })}`;

      console.log(url);
      res.redirect(url);
      //
      // request({
      //   url: url,
      //   method: 'GET'
      // }, (err, response, body) => {
      //   console.log(err);
      //   console.log(body);
      //   res.send(body);
      // })

    });
});

app.post('/user_mgt/login', (req, res) => {
  console.log(req.body);
  res.redirect(`${baseURL}/user_mgt/login`);

  // const oauth = new OAuth.OAuth(
  //   request_data.url,
  //   '',
  //   request_data.consumer.key,
  //   request_data.consumer.secret,
  //   '1.0',
  //   true,
  //   'HMAC-SHA1',
  //   50,
  //   {
  //     oauth_verifier: oauthData.oauth_verifier
  //   }
  // );
  //
  // oauth.post(
  //   `${baseURL}/oauth/token`,
  //   '',
  //   '',
  //   request_data.data,
  //   function (e, data, response){
  //     console.log(e);
  //     // const result = {};
  //     // const parameters = data.split('&');
  //     // for(let i in parameters) {
  //     //   let _r = parameters[i].split('=')
  //     //   result[_r[0]] = _r[1];
  //     // }
  //
  //     console.log(data);
  //     res.send();
  //   });
});

app.listen(3000, () => {

});

// request({
//   url: request_data.url,
//   method: request_data.method,
//   form: request_data.data,
//   headers: headers
// }, function(error, response, body) {
//   // Process your data here
//   console.log(error);
//   // console.log(response);
//   console.log(body);
// });