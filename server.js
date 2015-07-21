var Express = require('express');

var App = Express();
App.set('views', __dirname + '/views')
App.set('view engine', 'jade');
App.engine('jade', require('jade').__express);

App.use('/', Express.static(__dirname + '/static'));

App.use('/', require('./routes/pages.js'));
App.use('/recipes', require('./routes/recipes.js'));

//App.listen(process.env.KALTURA_RECIPES_PORT || 3000);
var port=process.env.KALTURA_RECIPES_PORT || 443
var https = require('https'),
fs = require('fs');
var sslOptions = {
  key: fs.readFileSync('/etc/ssl/certs/kaltura.org.key'),
  cert: fs.readFileSync('/etc/ssl/certs/kaltura.org.crt'),
  ca: fs.readFileSync('/etc/ssl/certs/ca-kaltura.org.crt'),
  requestCert: true,
  rejectUnauthorized: false
};
var secureServer = https.createServer(sslOptions,App).listen(port, function(){
  console.log("Secure Express server listening on port "+port);
});

