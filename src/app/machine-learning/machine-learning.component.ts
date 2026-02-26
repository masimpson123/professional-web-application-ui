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
  sessionId = crypto.randomUUID();
  modelData = null;
  trainingData: {metricOne: number, metricTwo: number}[]|null = null;
  trainingReport = null;
  linearRegressionPredictions = null;
  apiUrl = 'http://localhost:8080/';
  // apiUrl = 'https://msio-u7qjhl7iia-uc.a.run.app/';
  generateRenderTrainingData() {
    this.trainingData =
      new Array(100)
        .fill(0)
        .map((_, index) => ({
          metricOne: index + (((30 - index) * Math.max(.4, Math.random()))),
          metricTwo: (index ** 2) + (2000 * Math.random())
        }));
    tfvis.render.scatterplot(
      {
        name: 'metic one v metric two',
        drawArea: this.linearRegressionGraph.nativeElement
      },
      {
        values: this.trainingData.map(datum => ({x: datum.metricOne, y: datum.metricTwo})),
        series: ['2026']
      },
      {
        xLabel: 'metric one',
        yLabel: 'metric two',
        height: 300,
        seriesColors: ['green'],
      }
    );
  }
  initializeSaveModelWithSessionId() {
    fetch(this.apiUrl + 'tensorflow-save-model/' + this.sessionId)
      .then(saveOperationResponse => saveOperationResponse.json())
      .then(saveOperationResponse => {
        alert(saveOperationResponse.message);
      })
      .catch(err => {
        alert(err)
      });
  }
  trainModelRenderTrainingReport() {
    fetch(this.apiUrl + 'tensorflow-train-model', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: this.sessionId,
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
        sessionId: this.sessionId,
        trainingData: this.trainingData
      })
    })
      .then(testResultResponse => testResultResponse.json())
      .then(testResult => {
        tfvis.render.scatterplot(
          {
            name: 'Model Predictions vs Original Data',
            drawArea: this.linearRegressionGraph.nativeElement
          },
          {
            values: [testResult.originalPoints, testResult.predictedPoints],
            series: ['original', 'predicted']},
          {
        xLabel: 'metric one',
        yLabel: 'metric two',
            height: 300
          }
        );
      })
      .catch(err => {
        alert(err)
      });
  }
}
