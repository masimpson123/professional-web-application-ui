import { Component, ViewChild, ElementRef, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import * as tfvis from '@tensorflow/tfjs-vis';
import * as tf from '@tensorflow/tfjs';
import { form, Field, min, max, disabled } from '@angular/forms/signals';
import { ThreeDimensionalData } from '../common-models/common-models';
import { ScatterPlotXyzComponent } from '../scatter-plot-xyz/scatter-plot-xyz.component';

@Component({
  selector: 'app-machine-learning',
  imports: [Field, CurrencyPipe, ScatterPlotXyzComponent],
  templateUrl: './machine-learning.component.html',
  styleUrl: './machine-learning.component.css',
})
export class MachineLearningComponent {
  @ViewChild('univariatelinearregressiongraph') univariateLinearRegressionGraph!: ElementRef<HTMLInputElement>;
  @ViewChild('univariatetrainingreport') univariateTrainingReportGraph!: ElementRef<HTMLInputElement>;
  @ViewChild('univariatemodeltable') univariateModelTable!: ElementRef<HTMLInputElement>;
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
  multivariateTrainingData: number[][]|null = null;
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
  multivariateScatterPlotData: ThreeDimensionalData[][]|null = null;
  multivariateScatterPlotSeriesNames: string[]|null = null;
  multivariateScatterPlotSeriesColors: string[]|null = null;
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
      .then(multivariateTrainingData => {
        this.multivariateTrainingData = multivariateTrainingData;
        this.multivariateScatterPlotData = [
          multivariateTrainingData.map((datum:number[]) =>
            // x: price, y: temperature, z: units sold (vertical)
            ({x: datum[0], y: datum[1], z: datum[2]})
          ),
          []
        ];
        this.multivariateScatterPlotSeriesColors = ['orangered'];
        this.multivariateScatterPlotSeriesNames = ['Training data'];
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
        trainingData: this.multivariateTrainingData
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
        trainingData: this.multivariateTrainingData
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
        // x: price, y: temperature, z: units sold (vertical)
        this.multivariateScatterPlotData = [
          this.multivariateTrainingData?.map((datum:number[]) =>
            
            ({x: datum[0], y: datum[1], z: datum[2]})
          ),
          predictions.predictions.map(
            (prediction: {feature1: number, feature2: number, predictedLabel: number}) =>
              ({x: prediction.feature1, y: prediction.feature2, z: prediction.predictedLabel}))
        ];
        this.multivariateScatterPlotSeriesColors = ['slategrey', 'orangered'];
        this.multivariateScatterPlotSeriesNames = ['Training data', 'Predictions'];
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

interface RevenueData {
  price: number;
  temperature: number;
}
