var express = require('express');
var app = express();
const cors = require('cors');
const tensorflow = require('./tensorflow/tensorflow');

app.use(cors({
   origin: function (origin, callback) {
   // const allowedOrigins = ['https://msio-u7qjhl7iia-uc.a.run.app', 'http://localhost:4200', 'http://localhost:8080'];
   const allowedOrigins = ['https://msio-u7qjhl7iia-uc.a.run.app'];
   if (!origin) return callback(null, true);
   if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
   }
   return callback(null, true);
   }
}));

app.use(express.static("dist/client-2026/browser"));
app.use(express.static("tensorflow/model-data"));

app.get('/tensorflow-save-model-data/:keyword', async function(req, res) {
   res.send(await tensorflow.saveModel(req.params.keyword));
});
app.get('/tensorflow-get-model-data/:sessionid/:file', async function(req, res) {
   res.sendFile(`${__dirname}/tensorflow/model-data/${req.params.sessionid}/${req.params.file}`);
});
app.get('/tensorflow-get-training-data', async function(req, res) {
   res.send(await tensorflow.getData());
});
app.get('*default', function(req, res) {
   res.sendFile(__dirname + '/dist/client-2026/browser/index.html');
});

app.listen(8080);
