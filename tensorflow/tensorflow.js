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

async function getTensors(data) {
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

module.exports = {
  getTrainingData,
  saveModel,
  getTensors
};
