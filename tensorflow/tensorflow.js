async function getData() {
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
  
  const tf = require('@tensorflow/tfjs-node');
  const model = tf.sequential();
  model.add(tf.layers.dense({inputShape: [1], units: 1, useBias: true}));
  model.add(tf.layers.dense({units: 1, useBias: true}));
  model.save('file://' + path);
  
  return JSON.stringify({message: "The model was saved successfully."});
}

async function getTensors(trainingData) {
  return JSON.stringify({message: trainingData});
}

module.exports = {
  getData,
  saveModel,
  getTensors
};
