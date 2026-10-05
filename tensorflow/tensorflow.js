const tf = require('@tensorflow/tfjs-node');

/** Scales `tensor` so that `min` becomes 0 and `max` becomes 1. */
function normalize(tensor, min, max) {
  return tensor.sub(min).div(max.sub(min));
}

async function trainUnivariateModel(trainingData) {
  if (!trainingData) throw new Error('No training data!');
  const model = tf.sequential();
  model.add(tf.layers.dense({inputShape: [1], units: 1, useBias: true})); // input
  model.add(tf.layers.dense({units: 32, activation: 'relu'})); // hidden with Rectified Linear Unit (ReLU) activation
  model.add(tf.layers.dense({units: 32, activation: 'relu'}));
  model.add(tf.layers.dense({units: 32, activation: 'relu'}));
  model.add(tf.layers.dense({units: 1, useBias: true})); // output

  const tensors = getTensorsUnivariate(trainingData);
  const {inputs, labels} = tensors;

  model.compile({
    optimizer: tf.train.adam(),
    loss: tf.losses.meanSquaredError,
    metrics: ['mse'],
  });

  // train the model so that it "fits" the data
  const trainingReport = await model.fit(inputs, labels, {
    batchSize: Math.round(trainingData.length / 5),
    epochs: 100,
    shuffle: true
  });

  await model.save(`file://${__dirname}/model-data/univariate`);
  tf.dispose(tensors);
  model.dispose();

  return trainingReport;
}

function getTensorsUnivariate(data) {
  if (!data) throw new Error('No training data!');
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
    const normalizedInputs = normalize(inputTensor, inputMin, inputMax);
    const normalizedLabels = normalize(labelTensor, labelMin, labelMax);

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

async function getUnivariateLinearRegressionPredictions(trainingData) {
  if (!trainingData) throw new Error('No training data!');
  const model = await tf.loadLayersModel(`file://${__dirname}/model-data/univariate/model.json`);
  const stats = getTensorsUnivariate(trainingData);
  const {inputMax, inputMin, labelMin, labelMax} = stats;
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
  tf.dispose(stats);
  model.dispose();
  const predictedPoints = Array.from(xValues).map((val, i) => {
    return {input: val, label: predictedValues[i]}
  });
  return predictedPoints;
}

async function trainMultivariateModel(trainingData) {
  if (!trainingData) throw new Error('No training data!');
  const inputA = tf.input({shape: [1], name: 'featuresA'});
  const inputB = tf.input({shape: [1], name: 'featuresB'});
  const concat = tf.layers.concatenate().apply([inputA, inputB]);
  const dense  = tf.layers.dense({units: 16, activation: 'relu'}).apply(concat);
  const output = tf.layers.dense({units: 1}).apply(dense);

  const model = tf.model({inputs: [inputA, inputB], outputs: output});

  const tensors = getTensorsMultivariate(trainingData);
  const {inputs1, inputs2, labels} = tensors;

  model.compile({optimizer: 'adam', loss: 'meanSquaredError'});

  // train the model so that it "fits" the data
  const trainingReport = await model.fit([inputs1, inputs2], labels, {
    batchSize: Math.round(trainingData.length / 5),
    epochs: 200,
    shuffle: true
  });

  await model.save(`file://${__dirname}/model-data/multivariate`);
  tf.dispose(tensors);
  model.dispose();

  return trainingReport;
}

function getTensorsMultivariate(data) {
  if (!data) throw new Error('No training data!');
  return tf.tidy(() => {
    tf.util.shuffle(data);

    const inputs1 = data.map(datum => datum.shift()); // x1
    const inputs2 = data.map(datum => datum.shift()); // x2
    const labels = data.map(datum => datum.shift()); // y

    const inputs1Tensor = tf.tensor2d(inputs1, [inputs1.length, 1]);
    const inputs2Tensor = tf.tensor2d(inputs2, [inputs2.length, 1]);
    const labelsTensor = tf.tensor2d(labels, [labels.length, 1]);

    const input1Max = inputs1Tensor.max();
    const input1Min = inputs1Tensor.min();
    const input2Max = inputs2Tensor.max();
    const input2Min = inputs2Tensor.min();
    const labelMax = labelsTensor.max();
    const labelMin = labelsTensor.min();
    const normalizedInputs1 = normalize(inputs1Tensor, input1Min, input1Max);
    const normalizedInputs2 = normalize(inputs2Tensor, input2Min, input2Max);
    const normalizedLabels = normalize(labelsTensor, labelMin, labelMax);

    return {
      inputs1: normalizedInputs1,
      inputs2: normalizedInputs2,
      labels: normalizedLabels,
      input1Max,
      input1Min,
      input2Max,
      input2Min,
      labelMax,
      labelMin,
    };
  });
}

async function getMultivariateLinearRegressionPredictions(trainingData) {
  if (!trainingData) throw new Error('No training data!');
  const model = await tf.loadLayersModel(`file://${__dirname}/model-data/multivariate/model.json`);
  const stats = getTensorsMultivariate(trainingData);
  const { input1Max, input1Min, input2Max, input2Min, labelMax, labelMin } = stats;
  const features1 = [];
  const features2 = [];
  for (let feature1 = 10; feature1 <= 100; feature1 += 1) {
    for (let feature2 = 55; feature2 <= 100; feature2 += 1) {
      features1.push(feature1/10);
      features2.push(feature2);
    }
  }
  // Predict the whole grid in one batch; tidy frees every intermediate tensor.
  const unitsSold = tf.tidy(() => {
    const normalizedFeatures1 = normalize(tf.tensor2d(features1, [features1.length, 1]), input1Min, input1Max);
    const normalizedFeatures2 = normalize(tf.tensor2d(features2, [features2.length, 1]), input2Min, input2Max);
    return model.predict([normalizedFeatures1, normalizedFeatures2])
      .mul(labelMax.sub(labelMin))
      .add(labelMin)
      .dataSync();
  });
  tf.dispose(stats);
  model.dispose();
  const denormalizedPredictions = features1.map((feature1, i) => ({
    feature1,
    feature2: features2[i],
    predictedLabel: Math.round(unitsSold[i]) > 0 ? Math.round(unitsSold[i]) : 0
  }));
  return {predictions: denormalizedPredictions};
}

module.exports = {
  trainUnivariateModel,
  getUnivariateLinearRegressionPredictions,
  trainMultivariateModel,
  getMultivariateLinearRegressionPredictions
};
