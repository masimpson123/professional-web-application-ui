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
  modelData = null;
  training = false;
  trainingData: LinearRegressionPoint[][] = [];
  trainingReport = null;
  linearRegressionPredictions = null;
  modelConfiguration = null;
  // apiUrl = 'http://localhost:8080/';
  apiUrl = 'https://msio-u7qjhl7iia-uc.a.run.app/';
    getRenderModelConfiguration() {
      tf.loadLayersModel(this.apiUrl + 'tensorflow-get-model/model.json')
        .then(modelConfiguration => {
          this.modelConfiguration = modelConfiguration as any;
          const surface = {
            drawArea: this.modelTable.nativeElement
          };
          tfvis.show.modelSummary(surface, modelConfiguration);
        });
  }
  generateRenderTrainingData() {
    const positiveDirection = Math.random() > .5;
    this.trainingData.push(
      new Array(100)
        .fill(0)
        .map((_, index) => ({
          input: index + (((30 - index) * Math.max(.4, Math.random()))), // x
          label: (((positiveDirection ? (100 - index) : index) ** 2) + (2000 * Math.random())) / 100 // y
        })));
    this.renderScatterPlot([...this.trainingData], ['red']);
  }
  renderScatterPlot(
    data: LinearRegressionPoint[][],
    seriesColors: string[]
  ) {
    tfvis.render.scatterplot(
      {
        name: 'Model Predictions vs Original Data',
        drawArea: this.linearRegressionGraph.nativeElement
      },
      {
        values: data.map(
          series => series.map(
            series => ({x: series.input, y: series.label}))),
        series: ['traning data', 'predictions']
      },
      {
        xLabel: 'inputs',
        yLabel: 'labels',
        height: 300,
        seriesColors
      }
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
        trainingData: this.trainingData
      })
    })
      .then(async trainingReportResponse => {
        if (!trainingReportResponse.ok) throw new Error(await trainingReportResponse.text());
        return trainingReportResponse.json();
      })
      .then(trainingReport => {
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
        trainingData: this.trainingData
      })
    })
      .then(async predictionsResponse => {
        if (!predictionsResponse.ok) throw new Error(await predictionsResponse.text());
        return predictionsResponse.json();
      })
      .then(predictions => {
        this.renderScatterPlot([
          ...this.trainingData,
          predictions
        ],
        ['red', 'grey']);
      })
      .catch(err => {
        alert(err.message);
      });
  }
}

interface LinearRegressionPoint {
  input: number;
  label: number;
}
