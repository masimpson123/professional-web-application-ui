import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import * as tfvis from '@tensorflow/tfjs-vis';
import * as tf from '@tensorflow/tfjs';

@Component({
  selector: 'app-machine-learning',
  imports: [],
  templateUrl: './machine-learning.component.html',
  styleUrl: './machine-learning.component.css',
})
export class MachineLearningComponent {
  @ViewChild('modeldatatable') modelDrawArea!: ElementRef<HTMLInputElement>;
  @ViewChild('trainingdatagraph') graphDrawArea!: ElementRef<HTMLInputElement>;
  sessionId = crypto.randomUUID();
  // apiUrl = 'http://localhost:8080/';
  apiUrl = 'https://msio-u7qjhl7iia-uc.a.run.app/';
  saveModelData() {
    fetch(this.apiUrl + 'tensorflow-save-model-data/' + this.sessionId)
      .then(modelData => modelData.json())
      .then(model => {
        console.log(model);
      });
  }
  getRenderModelData() {
      tf.loadLayersModel(this.apiUrl + 'tensorflow-get-model-data/' + this.sessionId + "/model.json")
        .then(model => {
          const surface = { name: 'Model Summary', tab: 'Model Inspection', drawArea: this.modelDrawArea.nativeElement };
          tfvis.show.modelSummary(surface, model);
        });
  }
  getRenderTrainingData() {
    fetch(this.apiUrl + 'tensorflow-get-training-data')
      .then(res => res.json())
      .then(res => {
        const values = res.map((data:any) => ({
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
}
