import { Component, ViewChild, ElementRef } from '@angular/core';
import * as tfvis from '@tensorflow/tfjs-vis';
import * as tf from '@tensorflow/tfjs';

@Component({
  selector: 'app-machine-learning',
  imports: [],
  templateUrl: './machine-learning.component.html',
  styleUrl: './machine-learning.component.css',
})
export class MachineLearningComponent {
  @ViewChild('modeltable') modelTable!: ElementRef<HTMLInputElement>;
  @ViewChild('linearregressiongraph') linearRegressionGraph!: ElementRef<HTMLInputElement>;
  @ViewChild('trainingreportgraphs') trainingReportGraphs!: ElementRef<HTMLInputElement>;
  @ViewChild('multivariatedatatable') multivariateTable!: ElementRef<HTMLInputElement>;
  modelData = null;
  training = false;
  univariateData: LinearRegressionPoint[]|null = null;
  multivariateData: LinearRegressionDataSet|null = null;
  trainingReport = null;
  linearRegressionPredictions = null;
  modelConfiguration = null;
  trainingRequired = true;
  // apiUrl = 'http://localhost:8080/';
  apiUrl = 'https://msio-u7qjhl7iia-uc.a.run.app/';
  generateRenderUnivariateTrainingData() {
    this.trainingRequired = true;
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
  trainModelRenderTrainingReport() {
    this.trainingReport = null;
    this.trainingReportGraphs.nativeElement.innerHTML = '';
    this.training = true;
    fetch(this.apiUrl + 'tensorflow-train-model', {
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
        this.trainingRequired = false;
        this.training = false;
        this.trainingReport = trainingReport
        tfvis.show.history(
          {
            name: 'Training report',
            drawArea: this.trainingReportGraphs.nativeElement
          },
          trainingReport,
          ['loss'])
      })
      .catch(err => {
        this.training = false;
        alert(err.message);
      });
  }
  getLinearRegressionPredictions() {
    fetch(this.apiUrl + 'tensorflow-get-linear-regression-predictions', {
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
        if (!this.univariateData) return;
        this.renderScatterPlot(
          this.univariateData,
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
    tf.loadLayersModel(this.apiUrl + 'tensorflow-get-model/model.json')
      .then(modelConfiguration => {
        this.modelConfiguration = modelConfiguration as any;
        const surface = {
          drawArea: this.modelTable.nativeElement
        };
        tfvis.show.modelSummary(surface, modelConfiguration);
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
        drawArea: this.linearRegressionGraph.nativeElement
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
}

interface LinearRegressionPoint {
  input: number;
  label: number;
}

interface LinearRegressionDataSet {
  headers: string[],
  values: number[][]
}
