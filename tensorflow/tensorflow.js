const tf = require('@tensorflow/tfjs-node');

async function getTrainingData() {
  const carsDataResponse = await fetch('https://storage.googleapis.com/tfjs-tutorials/carsData.json');
  const carsData = await carsDataResponse.json();
  const cleaned = carsData.map(car => ({
    mpg: car.Miles_per_Gallon,
    horsepower: car.Horsepower,
  }))
  .filter(car => (car.mpg != null && car.horsepower != null));
  return cleaned;
}

async function saveModel(keyword) {
  const fs = require('fs/promises');
  const path = 'tensorflow/model-data/'+keyword;
  await fs.mkdir(path, { recursive: true });
  
  const model = tf.sequential();
  model.add(tf.layers.dense({inputShape: [1], units: 1, useBias: true}));
  model.add(tf.layers.dense({units: 1, useBias: true}));
  model.save('file://' + path);
  
  return {message: "The model data was saved successfully."};
}

function getTensors(data) {
  if (!data) return {message: "no training data. no tensors."}
  return tf.tidy(() => {
    tf.util.shuffle(data);

    const inputs = data.map(d => d.horsepower)
    const labels = data.map(d => d.mpg);
    const inputTensor = tf.tensor2d(inputs, [inputs.length, 1]);
    const labelTensor = tf.tensor2d(labels, [labels.length, 1]);

    const inputMax = inputTensor.max();
    const inputMin = inputTensor.min();
    const labelMax = labelTensor.max();
    const labelMin = labelTensor.min();
    const normalizedInputs = inputTensor.sub(inputMin).div(inputMax.sub(inputMin));
    const normalizedLabels = labelTensor.sub(labelMin).div(labelMax.sub(labelMin));

    return {
      inputs: normalizedInputs,
      labels: normalizedLabels,
      inputMax,
      inputMin,
      labelMax,
      labelMin,
    }
  });
}

async function trainModel(sessionId, trainingData) {
  const path = `file://${__dirname}/model-data/${sessionId}`;
  const model = await tf.loadLayersModel(path + '/model.json');
  const {inputs, labels} = await getTensors(trainingData);

  model.compile({
    optimizer: tf.train.adam(),
    loss: tf.losses.meanSquaredError,
    metrics: ['mse'],
  });

  const batchSize = 32;
  const epochs = 100;

  const trainingReport = await model.fit(inputs, labels, {
    batchSize,
    epochs,
    shuffle: true
  });

  model.save(path);

  return trainingReport;
}

async function getLinearRegressionPredictions(sessionId, trainingData) {
  const model = await tf.loadLayersModel(`file://${__dirname}/model-data/${sessionId}/model.json`);
  const {inputMax, inputMin, labelMin, labelMax} = getTensors(trainingData);
  const [xValues, predictedValues] = tf.tidy(() => {
    const normalizedXValues = tf.linspace(0, 1, 100);
    const predictions = model.predict(normalizedXValues.reshape([100, 1]));
    const denormalizedXValues = normalizedXValues
      .mul(inputMax.sub(inputMin))
      .add(inputMin);
    const denormalizedPredictedValues = predictions
      .mul(labelMax.sub(labelMin))
      .add(labelMin);
    return [denormalizedXValues.dataSync(), denormalizedPredictedValues.dataSync()];
  });
  const predictedPoints = Array.from(xValues).map((val, i) => {
    return {x: val, y: predictedValues[i]}
  });
  const originalPoints = trainingData.map(d => ({
    x: d.horsepower, y: d.mpg,
  }));
  return {originalPoints, predictedPoints};
}

module.exports = {
  getTrainingData,
  saveModel,
  getTensors,
  trainModel,
  getLinearRegressionPredictions
};
