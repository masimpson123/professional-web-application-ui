var express = require('express');
var app = express();
const cors = require('cors');
const tensorflow = require('./tensorflow/tensorflow');
const iceCreamData = require('./tensorflow/ice-cream-data');

app.use(cors({
   origin: function (origin, callback) {
   // const allowedOrigins = ['http://localhost:4200'];
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
app.use(express.json());

app.get('/tensorflow-get-model/:file', async function(req, res) {
   res.sendFile(`${__dirname}/tensorflow/model-data/${req.params.file}`);
});
app.get('/tensorflow-get-multivariate-data', async function(req, res) {
   res.send(iceCreamData.iceCreamData);
});
app.post('/tensorflow-train-model', async function(req, res) {
   res.send(await tensorflow.trainModel(req.body.trainingData));
});
app.post('/tensorflow-get-linear-regression-predictions', async function(req, res) {
   res.send(await tensorflow.getLinearRegressionPredictions(req.body.trainingData));
});
app.get('*default', function(req, res) {
   res.sendFile(__dirname + '/dist/client-2026/browser/index.html');
});

app.use((err, req, res, next) => {
   res.status(500).send(err.message);
});

app.listen(8080);
