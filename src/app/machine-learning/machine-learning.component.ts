import { Component, ViewChild, ElementRef, signal } from '@angular/core';
import { NgClass, CurrencyPipe } from '@angular/common';
import * as tfvis from '@tensorflow/tfjs-vis';
import * as tf from '@tensorflow/tfjs';
import { form, Field, min, max, disabled } from '@angular/forms/signals';
import { ThreeDimensionalData } from '../common-models/common-models';
import { ScatterPlotXyzComponent } from '../scatter-plot-xyz/scatter-plot-xyz.component';

@Component({
  selector: 'app-machine-learning',
  imports: [NgClass, Field, CurrencyPipe, ScatterPlotXyzComponent],
  templateUrl: './machine-learning.component.html',
  styleUrl: './machine-learning.component.css',
})
export class MachineLearningComponent {
  @ViewChild('univariatelinearregressiongraph') univariateLinearRegressionGraph!: ElementRef<HTMLInputElement>;
  @ViewChild('univariatetrainingreport') univariateTrainingReportGraph!: ElementRef<HTMLInputElement>;
  @ViewChild('univariatemodeltable') univariateModelTable!: ElementRef<HTMLInputElement>;
  @ViewChild('multivariatedatatable') multivariateTable!: ElementRef<HTMLInputElement>;
  @ViewChild('multivariatetrainingreport') multivariateTrainingReportGraph!: ElementRef<HTMLInputElement>;
  apiUrl = 'http://localhost:8080/';
  // apiUrl = 'https://msio-u7qjhl7iia-uc.a.run.app/';
  univariateModelData = null;
  univariateModelIsTraining = false;
  univariateData: LinearRegressionPoint[]|null = null;
  univariateTrainingReport = null;
  univariateLinearRegressionPredictions = null;
  univariateModelConfiguration = null;
  univariateTrainingRequired = true;
  multivariateData: LinearRegressionDataSet|null = null;
  multivariateTrainingReport = null;
  multivariateModelIsTraining = false;
  multivariateTrainingRequired = signal(true);
  revenuePredictionModel = signal<RevenueData>({
    price: 3,
    temperature: 80
  });
  revenuePredictionForm = form(this.revenuePredictionModel, (schemaPath) => {
    min(schemaPath.price, 1, { message: 'We should charge more' });
    max(schemaPath.price, 10, { message: 'We should charge less' });
    min(schemaPath.temperature, 55, { message: 'That is too cold' });
    max(schemaPath.temperature, 100, { message: 'That is too hot' });
    disabled(schemaPath.price, this.multivariateTrainingRequired);
    disabled(schemaPath.temperature, this.multivariateTrainingRequired);
  });
  prediction: string|null = null;
  predictions: ThreeDimensionalData[]|null = null;
  generateRenderUnivariateTrainingData() {
    this.univariateTrainingRequired = true;
    this.univariateTrainingReport = null;
    this.univariateTrainingReportGraph.nativeElement.innerHTML = '';
    const positiveDirection = Math.random() > .5;
    this.univariateData =
      new Array(100)
        .fill(0)
        .map((_, index) => ({
          input: index + (((30 - index) * Math.max(.4, Math.random()))), // x
          label: (((positiveDirection ? (100 - index) : index) ** 2) + (2000 * Math.random())) / 100 // y
        }));
    this.renderScatterPlot(
      this.univariateData,
      [],
      ['orangered', 'slategrey'],
      ['2d traning data', 'predictions']
    );
  }
  trainUnivariateModelRenderTrainingReport() {
    this.univariateTrainingReport = null;
    this.univariateTrainingReportGraph.nativeElement.innerHTML = '';
    this.univariateModelIsTraining = true;
    fetch(this.apiUrl + 'tensorflow-train-univariate-model', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trainingData: this.univariateData
      })
    })
      .then(async trainingReportResponse => {
        if (!trainingReportResponse.ok) throw new Error(await trainingReportResponse.text());
        return trainingReportResponse.json();
      })
      .then(trainingReport => {
        this.univariateTrainingRequired = false;
        this.univariateModelIsTraining = false;
        this.univariateTrainingReport = trainingReport
        tfvis.show.history(
          {
            name: 'Training report',
            drawArea: this.univariateTrainingReportGraph.nativeElement
          },
          trainingReport,
          ['loss'])
      })
      .catch(err => {
        this.univariateModelIsTraining = false;
        alert(err.message);
      });
  }
  getRenderUnivariateLinearRegressionPredictions() {
    if (!this.univariateData) return;
    fetch(this.apiUrl + 'tensorflow-get-univariate-linear-regression-predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trainingData: this.univariateData
      })
    })
      .then(async predictionsResponse => {
        if (!predictionsResponse.ok) throw new Error(await predictionsResponse.text());
        return predictionsResponse.json();
      })
      .then(predictions => {
        this.renderScatterPlot(
          this.univariateData!,
          predictions,
          ['slategrey', 'orangered'],
          ['2d traning data', 'predictions']
        );
      })
      .catch(err => {
        alert(err.message);
      });
  }
  getRenderUnivariateModelConfiguration() {
    tf.loadLayersModel(this.apiUrl + 'tensorflow-get-univariate-model-configuration/model.json')
      .then(modelConfiguration => {
        this.univariateModelConfiguration = modelConfiguration as any;
        const surface = {
          drawArea: this.univariateModelTable.nativeElement
        };
        tfvis.show.modelSummary(surface, modelConfiguration);
      });
  }
  getRenderMultivariateTrainingData() {
    fetch(this.apiUrl + 'tensorflow-get-multivariate-data')
      .then(multivariateDataResponse => multivariateDataResponse.json())
      .then(multivariateData => {
        this.multivariateData = {
          headers: [
            'price', 'temperature', 'number sold'
          ],
          values: [
            ...multivariateData
          ]
        };
        tfvis.render.table(
          {
            drawArea: this.multivariateTable.nativeElement
          },
          this.multivariateData);
      });
  }
  trainMultivariateModelRenderTrainingReport() {
    this.multivariateTrainingReport = null;
    this.multivariateTrainingReportGraph.nativeElement.innerHTML = '';
    this.multivariateModelIsTraining = true;
    fetch(this.apiUrl + 'tensorflow-train-multivariate-model', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trainingData: this.multivariateData
      })
    })
      .then(async trainingReportResponse => {
        if (!trainingReportResponse.ok) throw new Error(await trainingReportResponse.text());
        return trainingReportResponse.json();
      })
      .then(trainingReport => {
        this.multivariateTrainingRequired.update(() => false)
        this.multivariateModelIsTraining = false;
        this.multivariateTrainingReport = trainingReport
        tfvis.show.history(
          {
            name: 'Training report',
            drawArea: this.multivariateTrainingReportGraph.nativeElement
          },
          trainingReport,
          ['loss'])
      })
      .catch(err => {
        this.multivariateModelIsTraining = false;
        alert(err.message);
      });
  }
  predictNumberOfUnitsSold() {
    fetch(this.apiUrl + 'tensorflow-get-multivariate-linear-regression-predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trainingData: this.multivariateData
      })
    })
      .then(async predictionsResponse => {
        if (!predictionsResponse.ok) throw new Error(await predictionsResponse.text());
        return predictionsResponse.json();
      })
      .then(predictions => {
        this.prediction = `
          ${predictions.prediction} water bottles will be sold for $${predictions.prediction * this.revenuePredictionModel().price}.
        `;
        // x price
        // y temperature
        // z units sold (vertical)
        this.predictions = predictions.predictions.map(
          (prediction: {feature1: number, feature2: number, predictedLabel: number}) =>
            ({x: (prediction.feature1 - 1) * -10, y: (prediction.feature2 - 55), z: prediction.predictedLabel / 10}));
      })
      .catch(err => {
        alert(err.message);
      });
  }
  renderScatterPlot(
    trainingData: LinearRegressionPoint[],
    predictions: LinearRegressionPoint[],
    seriesColors: string[],
    seriesNames: string[]
  ) {
    tfvis.render.scatterplot(
      {
        name: 'Model Predictions vs Original Data',
        drawArea: this.univariateLinearRegressionGraph.nativeElement
      },
      {
        values: [
          trainingData.map(datum => ({x: datum.input, y: datum.label})),
          predictions.map(datum => ({x: datum.input, y: datum.label}))
        ],
        series: seriesNames},
      {
        xLabel: 'inputs',
        yLabel: 'labels',
        height: 300,
        seriesColors
      }
    );
  }
}

interface LinearRegressionPoint {
  input: number;
  label: number;
}

interface LinearRegressionDataSet {
  headers: string[],
  values: number[][]
}

interface RevenueData {
  price: number;
  temperature: number;
}
