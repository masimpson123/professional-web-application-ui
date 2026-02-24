import { Component, ViewChild, ElementRef } from '@angular/core';
import { JsonPipe } from '@angular/common';
import * as tfvis from '@tensorflow/tfjs-vis';
import * as tf from '@tensorflow/tfjs';

@Component({
  selector: 'app-machine-learning',
  imports: [JsonPipe],
  templateUrl: './machine-learning.component.html',
  styleUrl: './machine-learning.component.css',
})
export class MachineLearningComponent {
  @ViewChild('modeldatatable') modelDrawArea!: ElementRef<HTMLInputElement>;
  @ViewChild('trainingdatagraph') graphDrawArea!: ElementRef<HTMLInputElement>;
  sessionId = crypto.randomUUID();
  modelData: tf.LayersModel|null = null;
  trainingData = null;
  tensors = null;
  // apiUrl = 'http://localhost:8080/';
  apiUrl = 'https://msio-u7qjhl7iia-uc.a.run.app/';
  saveModelDataForSession() {
    fetch(this.apiUrl + 'tensorflow-save-model-data/' + this.sessionId)
      .then(saveOperationResponse => saveOperationResponse.json())
      .then(saveOperationResponse => {
        alert(saveOperationResponse.message);
      });
  }
  getRenderModelDataForSession() {
      tf.loadLayersModel(this.apiUrl + 'tensorflow-get-model-data/' + this.sessionId + "/model.json")
        .then(model => {
          this.modelData = model;
          const surface = { name: 'Model Summary', tab: 'Model Inspection', drawArea: this.modelDrawArea.nativeElement };
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
            drawArea: this.graphDrawArea.nativeElement
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
      });
  }
  getTensorsFromTrainingData() {
    fetch(this.apiUrl + 'tensorflow-training-data-to-tensors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({trainingData: this.trainingData})
    })
      .then(tensorsData => tensorsData.json())
      .then(tensors => {
        this.tensors = tensors;
      });
  }
}
