var express = require('express');
var app = express();
const cors = require('cors');
const tensorflow = require('./tensorflow/tensorflow');
const data = require('./tensorflow/water-bottle-data');

app.use(cors({
   origin: function (origin, callback) {
   const allowedOrigins = ['http://localhost:4200'];
   // const allowedOrigins = ['https://msio-u7qjhl7iia-uc.a.run.app'];
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

app.post('/tensorflow-train-univariate-model', async function(req, res) {
   res.send(await tensorflow.trainUnivariateModel(req.body.trainingData));
});
app.post('/tensorflow-get-univariate-linear-regression-predictions', async function(req, res) {
   res.send(await tensorflow.getUnivariateLinearRegressionPredictions(req.body.trainingData));
});
app.get('/tensorflow-get-univariate-model-configuration/:file', async function(req, res) {
   res.sendFile(`${__dirname}/tensorflow/model-data/univariate/${req.params.file}`);
});
app.get('/tensorflow-get-multivariate-data', async function(req, res) {
   res.send(data.waterBottleData);
});
app.post('/tensorflow-train-multivariate-model', async function(req, res) {
   res.send(await tensorflow.trainMultivariateModel(req.body.trainingData));
});
app.post('/tensorflow-get-multivariate-linear-regression-prediction', async function(req, res) {
   res.send(await tensorflow.getMultivariateLinearRegressionPrediction(
      req.body.trainingData,
      req.body.price, 
      req.body.temperature));
});
app.get('*default', function(req, res) {
   res.sendFile(__dirname + '/dist/client-2026/browser/index.html');
});

app.use((err, req, res, next) => {
   res.status(500).send(err.message);
});

app.listen(8080);
