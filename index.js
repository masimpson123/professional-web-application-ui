var express = require('express');
var app = express();
const cors = require('cors');

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
app.get('/tensorflow', async function(req, res) {
   const tensorflow = require('./tensorflow/tensorflow');
   res.send(await tensorflow.getData());
});
app.get('*default', function(req, res) {
   res.sendFile(__dirname + '/dist/client-2026/browser/index.html');
});

app.listen(8080);
