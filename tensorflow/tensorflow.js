const tf = require('@tensorflow/tfjs-node');

async function trainUnivariateModel(trainingData) {
  if (!trainingData) throw new Error('No training data!');
  const model = tf.sequential();
  model.add(tf.layers.dense({inputShape: [1], units: 1, useBias: true})); // input
  model.add(tf.layers.dense({units: 32, activation: 'relu'})); // hidden with Rectified Linear Unit (ReLU) activation
  model.add(tf.layers.dense({units: 32, activation: 'relu'}));
  model.add(tf.layers.dense({units: 32, activation: 'relu'}));
  model.add(tf.layers.dense({units: 1, useBias: true})); // output

  const {inputs, labels} = getTensorsUnivariate(trainingData);

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

  model.save(`file://${__dirname}/model-data/univariate`);

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

async function getUnivariateLinearRegressionPredictions(trainingData) {
  if (!trainingData) throw new Error('No training data!');
  const model = await tf.loadLayersModel(`file://${__dirname}/model-data/univariate/model.json`);
  const {inputMax, inputMin, labelMin, labelMax} = getTensorsUnivariate(trainingData);
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

async function trainMultivariateModel(trainingData) {
  if (!trainingData) throw new Error('No training data!');
  const inputA = tf.input({shape: [1], name: 'featuresA'});
  const inputB = tf.input({shape: [1], name: 'featuresB'});
  const concat = tf.layers.concatenate().apply([inputA, inputB]);
  const dense  = tf.layers.dense({units: 16, activation: 'relu'}).apply(concat);
  const output = tf.layers.dense({units: 1}).apply(dense);

  const model = tf.model({inputs: [inputA, inputB], outputs: output});

  const {inputs1, inputs2, labels} = getTensorsMultivariate(trainingData.values);

  model.compile({optimizer: 'adam', loss: 'meanSquaredError'});

  // train the model so that it "fits" the data
  const trainingReport = await model.fit([inputs1, inputs2], labels, {
    batchSize: Math.round(trainingData.values.length / 5),
    epochs: 200,
    shuffle: true
  });

  model.save(`file://${__dirname}/model-data/multivariate`);

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
    const normalizedInputs1 = inputs1Tensor.sub(input1Min).div(input1Max.sub(input1Min));
    const normalizedInputs2 = inputs2Tensor.sub(input2Min).div(input2Max.sub(input2Min));
    const normalizedLabels = labelsTensor.sub(labelMin).div(labelMax.sub(labelMin));

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
  const model = await tf.loadLayersModel(`file://${__dirname}/model-data/multivariate/model.json`);
  const { input1Max, input1Min, input2Max, input2Min, labelMax, labelMin } = getTensorsMultivariate(trainingData.values);
  const denormalizedPredictions = [];
  for (feature1 = 10; feature1 <= 100; feature1 += 1) {
    for (feature2 = 55; feature2 <= 100; feature2 += 1) {
      const normalizedFeature1 = tf.tensor2d([[feature1/10]], [1, 1]).sub(input1Min).div(input1Max.sub(input1Min));
      const normalizedFeature2 = tf.tensor2d([[feature2]], [1, 1]).sub(input2Min).div(input2Max.sub(input2Min));
      const unitsSold = model.predict([
        normalizedFeature1,
        normalizedFeature2
      ])
        .mul(labelMax.sub(labelMin))
        .add(labelMin)
        .dataSync()[0];
      denormalizedPredictions.push({feature1: feature1/10, feature2, predictedLabel: Math.round(unitsSold)})
    }
  }
  return {predictions: denormalizedPredictions};
}

module.exports = {
  trainUnivariateModel,
  getUnivariateLinearRegressionPredictions,
  trainMultivariateModel,
  getMultivariateLinearRegressionPredictions
};
