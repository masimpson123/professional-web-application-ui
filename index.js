var express = require('express');
var app = express();

app.use(express.static("dist/client-2026/browser"));

// TODO: remove after next successful deployment
// app.get('/*all-routes', function(req, res) {
//    res.sendFile(__dirname + '/dist/client-2026/browser/index.html');
// });

app.get('/tensorflow', function(req, res) {
   res.send('this route will serve tensor flow based machine learning predictions');
});

app.listen(8080);
