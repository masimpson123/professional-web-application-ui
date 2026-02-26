const tf = require('@tensorflow/tfjs-node');

function getTensors(data) {
  if (!data) return {message: "no training data. no tensors."}
  return tf.tidy(() => {
    tf.util.shuffle(data);

    const inputs = data.map(datum => datum.input); // x
    const labels = data.map(datum => datum.label); // y
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

async function trainModel(trainingData) {
  const model = tf.sequential();
  model.add(tf.layers.dense({inputShape: [1], units: 1, useBias: true})); // input
  model.add(tf.layers.dense({units: 50, activation: 'relu'})); // hidden
  model.add(tf.layers.dense({units: 1, useBias: true})); // output

  const {inputs, labels} = getTensors(trainingData);

  model.compile({
    optimizer: tf.train.adam(),
    loss: tf.losses.meanSquaredError,
    metrics: ['mse'],
  });

  const batchSize = 32;
  const epochs = 250;

  const trainingReport = await model.fit(inputs, labels, {
    batchSize,
    epochs,
    shuffle: true
  });

  model.save(`file://${__dirname}/model-data`);

  return trainingReport;
}

async function getLinearRegressionPredictions(trainingData) {
  const model = await tf.loadLayersModel(`file://${__dirname}/model-data/model.json`);
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
    return {input: val, label: predictedValues[i]}
  });
  return predictedPoints;
}

module.exports = {
  trainModel,
  getLinearRegressionPredictions
};