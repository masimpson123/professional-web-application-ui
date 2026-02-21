import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import * as tfvis from '@tensorflow/tfjs-vis';

@Component({
  selector: 'app-machine-learning',
  imports: [],
  templateUrl: './machine-learning.component.html',
  styleUrl: './machine-learning.component.css',
})
export class MachineLearningComponent {
  @ViewChild('machinelearningvisualization') drawArea!: ElementRef<HTMLInputElement>;
  ngAfterViewInit() {
    // fetch('http://localhost:8080/tensorflow')
    fetch('https://msio-u7qjhl7iia-uc.a.run.app/tensorflow')
      .then(res => res.json())
      .then(res => {
        const values = res.map((data:any) => ({
          x: data.horsepower,
          y: data.mpg,
        }));
        tfvis.render.scatterplot(
          {
            name: 'Horsepower v MPG',
            drawArea: this.drawArea.nativeElement
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
