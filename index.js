var express = require('express');
var app = express();

app.use(express.static("dist/client-2026/browser"));

app.get('/*all-routes', function(req, res) {
   res.sendFile(__dirname + '/dist/client-2026/browser/index.html');
});

app.listen(8080);
