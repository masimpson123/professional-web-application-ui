var express = require('express');
var app = express();
const cors = require('cors');
const tensorflow = require('./tensorflow/tensorflow');
const data = require('./tensorflow/water-bottle-data');

// Cloud Run serves this service at both of its URLs: the original hashed one and the
// newer project-number one. `node index.js --local-development` also allows `npm start`.
const allowedOrigins = [
   'https://msio-u7qjhl7iia-uc.a.run.app',
   'https://msio-205823180568.us-central1.run.app',
];
if (process.argv.includes('--local-development')) allowedOrigins.push('http://localhost:4200');

app.use(express.static("dist/client-2026/browser"));
app.use(express.static("tensorflow/model-data"));
app.use(express.json());
// CORS covers only the API. Browsers send an Origin header even when loading the app's own
// scripts, so a site-wide check would block the app wherever its origin isn't listed.
const apiCors = cors({ origin: allowedOrigins });
app.use((req, res, next) => (req.path.startsWith('/tensorflow-') ? apiCors(req, res, next) : next()));

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
app.post('/tensorflow-get-multivariate-linear-regression-predictions', async function(req, res) {
   res.send(await tensorflow.getMultivariateLinearRegressionPredictions(req.body.trainingData));
});
app.get('*default', function(req, res) {
   res.sendFile(__dirname + '/dist/client-2026/browser/index.html');
});

app.use((err, req, res, next) => {
   res.status(500).send(err.message);
});

app.listen(8080);
