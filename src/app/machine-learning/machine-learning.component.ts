import { Component, ViewChild, ElementRef } from '@angular/core';
import * as tfvis from '@tensorflow/tfjs-vis';

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
  modelData = null;
  trainingData: LinearRegressionPoint[] = [];
  trainingReport = null;
  linearRegressionPredictions = null;
  apiUrl = 'http://localhost:8080/';
  // apiUrl = 'https://msio-u7qjhl7iia-uc.a.run.app/';
  generateRenderTrainingData() {
    this.trainingData =
      new Array(100)
        .fill(0)
        .map((_, index) => ({
          input: index + (((30 - index) * Math.max(.4, Math.random()))),
          label: (index ** 2) + (2000 * Math.random())
        }));
    this.renderScatterPlot(this.trainingData, []);
  }
  renderScatterPlot(
    trainingData: LinearRegressionPoint[],
    predictions: LinearRegressionPoint[]
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
        series: ['traning data', 'predictions']},
      {
        xLabel: 'inputs',
        yLabel: 'labels',
        height: 300,
        seriesColors: ['red', 'grey']
      }
    );
  }
  trainModelRenderTrainingReport() {
    fetch(this.apiUrl + 'tensorflow-train-model', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trainingData: this.trainingData
      })
    })
      .then(trainingReportResponse => trainingReportResponse.json())
      .then(trainingReport => {
        this.trainingReport = trainingReport
        tfvis.show.history(
          {
            name: 'Training report',
            drawArea: this.trainingReportGraphs.nativeElement
          },
          trainingReport,
          ['loss', 'mse'])
      })
      .catch(err => {
        alert(err)
      });
  }
  getLinearRegressionPredictions() {
    fetch(this.apiUrl + 'tensorflow-get-linear-regression-predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trainingData: this.trainingData
      })
    })
      .then(predictionsResponse => predictionsResponse.json())
      .then(predictions => {
        this.renderScatterPlot(
          this.trainingData,
          predictions
        );
      })
      .catch(err => {
        alert(err)
      });
  }
}

interface LinearRegressionPoint {
  input: number;
  label: number;
}