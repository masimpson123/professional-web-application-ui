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
  @ViewChild('trainingdatagraph') trainingDataGraph!: ElementRef<HTMLInputElement>;
  @ViewChild('trainingreportgraphs') trainingReportGraphs!: ElementRef<HTMLInputElement>;
  @ViewChild('linearregressionpredictions') linearRegressionPredictions!: ElementRef<HTMLInputElement>;
  sessionId = crypto.randomUUID();
  modelData = null;
  trainingData = null;
  trainingReport = null;
  apiUrl = 'http://localhost:8080/';
  // apiUrl = 'https://msio-u7qjhl7iia-uc.a.run.app/';
  saveModelDataForSession() {
    fetch(this.apiUrl + 'tensorflow-save-model/' + this.sessionId)
      .then(saveOperationResponse => saveOperationResponse.json())
      .then(saveOperationResponse => {
        alert(saveOperationResponse.message);
      })
      .catch(err => {
        alert(err)
      });
  }
  getRenderModelDataForSession() {
      tf.loadLayersModel(this.apiUrl + 'tensorflow-get-model/' + this.sessionId + "/model.json")
        .then(model => {
          this.modelData = model as any;
          const surface = {
            name: 'Model Summary',
            tab: 'Model Inspection',
            drawArea: this.modelTable.nativeElement
          };
          tfvis.show.modelSummary(surface, model);
        })
        .catch(err => {
          alert(err)
        });
  }
  getRenderTrainingData() {
    fetch(this.apiUrl + 'tensorflow-get-training-data')
      .then(trainingDataResponse => trainingDataResponse.json())
      .then(trainingData => {
        this.trainingData = trainingData;
        const values = trainingData.map((data:any) => ({
          x: data.horsepower,
          y: data.mpg,
        }));
        tfvis.render.scatterplot(
          {
            name: 'Horsepower v MPG',
            drawArea: this.trainingDataGraph.nativeElement
          },
          {
            values,
            series: ['2024']
          },
          {
            xLabel: 'Horsepower',
            yLabel: 'MPG',
            height: 300,
            seriesColors: ['green'],
          }
        );
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
            drawArea: this.linearRegressionPredictions.nativeElement
          },
          {
            values: [testResult.originalPoints, testResult.predictedPoints],
            series: ['original', 'predicted']},
          {
            xLabel: 'Horsepower',
            yLabel: 'MPG',
            height: 300
          }
        );
      })
      .catch(err => {
        alert(err)
      });
  }
}
