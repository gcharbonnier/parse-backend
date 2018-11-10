// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');
var ParseDashboard = require('parse-dashboard');
var localConfig = require('./localConfig.json'); //save default(when env vars are not set) config values (file ignored by git)
var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}




var api = new ParseServer({
  databaseURI: databaseUri || localConfig.databaseURI,
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || localConfig.appId,
  masterKey: process.env.MASTER_KEY || localConfig.masterKey,
  serverURL: process.env.SERVER_URL || localConfig.serverURL,
  clientKey : process.env.CLIENT_KEY || localConfig.clientKey,
  restAPIKey : process.env.REST_KEY || localConfig.restAPIKey,
  push: {
    android: {
      apiKey: process.env.FCM_API_KEY || localConfig.fcmApiKey
    }
  },
  liveQuery: {
    classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
  },
  verifyUserEmails: true,
  emailVerifyTokenValidityDuration: 24 * 60 * 60,
  preventLoginWithUnverifiedEmail: false,
  publicServerURL: 'https://qtbaassample.herokuapp.com/parse',
  appName: 'BaaSSample',
  emailAdapter: {
    module: '@parse/simple-mailgun-adapter',
    options: {
      // The address that your emails come from
      fromAddress: process.env.MAILGUN_FROMADDRESS || localConfig.mailgunFromAddress,
      // Your domain from mailgun.com
      domain: process.env.MAILGUN_DOMAIN || localConfig.mailgunDomain,
      // Your API key from mailgun.com
      apiKey: process.env.MAILGUN_APIKEY || localConfig.mailgunApiKey,
    }
    },
    accountLockout: {
    duration: 5, // duration policy setting determines the number of minutes that a locked-out account remains locked out before automatically becoming unlocked. Set it to a value greater than 0 and less than 100000.
    threshold: 3, // threshold policy setting determines the number of failed sign-in attempts that will cause a user account to be locked. Set it to an integer value greater than 0 and less than 1000.
  },
  passwordPolicy: {
    validatorPattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/, // enforce password with at least 8 char with at least 1 lower case, 1 upper case and 1 digit
    //validatorCallback: (password) => { return validatePassword(password) },
    doNotAllowUsername: true, // optional setting to disallow username in passwords
    //maxPasswordAge: 90, // optional setting in days for password expiry. Login fails if user does not reset the password within this period after signup/last reset.
    maxPasswordHistory: 0, // optional setting to prevent reuse of previous n passwords. Maximum value that can be specified is 20. Not specifying it or specifying 0 will not enforce history.
    resetTokenValidityDuration: 24*60*60, // expire after 24 hours
  }
});

var options = { allowInsecureHTTP: false };
var dashboard = new ParseDashboard({
  "apps": [
    {
      "serverURL": process.env.SERVER_URL || localConfig.serverURL,
      "appId": process.env.APP_ID || localConfig.appId,
      "masterKey": process.env.MASTER_KEY || localConfig.masterKey,
      "appName": "BaaSSample",
    }
  ],
  "users": [
    {
      "user":"admin",
      "pass":process.env.DASHADMIN_PASSWORD || "password"
    }
  ],
  "trustProxy": 1,
  options
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);
app.use('/dashboard', dashboard);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('Parse-Server for demonstrating '+ (process.env.APP_ID || localConfig.appId));
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
