import { Component, Input } from '@angular/core';
import { PlotlyModule, PlotlyService } from 'angular-plotly.js';
import { ThreeDimensionalData } from '../common-models/common-models';
import Plotly from 'plotly.js-dist-min';

if (!PlotlyService.plotly) {
  PlotlyService.setPlotly(Plotly);
}

@Component({
  selector: 'app-scatter-plot-xyz',
  imports: [
    PlotlyModule
  ],
  providers: [
    PlotlyService
  ],
  template: `
    @if (xyzData) {
      <span class="no-margin">
        <plotly-plot
          [data]="plotData"
          [layout]="{
            showlegend: true,
            legend: {
              itemsizing: 'constant'
            },
            scene: {
              camera: {
                center: { x: 0, y: 0, z: -0.2 },
                eye: {x: 2, y: 1, z: 1} 
              },
              xaxis: { title: { text: 'Price' } },
              yaxis: { title: { text: 'Temperature' } },
              zaxis: { title: { text: 'Water bottles sold' } },
              aspectmode: 'cube'
            },
            margin: { l: 0, r: 0, b: 0, t: 0 },
            width: 800,
            height: 400
          }"
          [config]="{
            responsive: true,
            displayModeBar: false,
            displaylogo: false
          }"
        ></plotly-plot>
      </span>
    }
  `,
  styleUrl: './scatter-plot-xyz.component.css',
})
export class ScatterPlotXyzComponent {
  @Input() xyzData: ThreeDimensionalData[][]|null = null;
  @Input() seriesColors: string[]|null = null;
  @Input() seriesNames: string[]|null = null;
  plotData:any = [];
  ngOnChanges() {
    if (!this.xyzData) return;
    this.plotData = this.xyzData.map((dataSet, index) => ({
      x: dataSet.map(datum => datum.x),
      y: dataSet.map(datum => datum.y),
      z: dataSet.map(datum => datum.z),
      mode: 'markers',
      type: 'scatter3d',
      marker: {
        size: 1.5 - index,
        color: this.seriesColors ? this.seriesColors[index] : 'slategrey',
        colorscale: 'Viridis',
        opacity: 1
      },
      name: this.seriesNames ? this.seriesNames[index] : 'Series ' + index
    }));
  }
}
