import { Component, Input } from '@angular/core';
import { PlotlyModule, PlotlyService } from 'angular-plotly.js';
import Plotly from 'plotly.js-dist-min';

if (!PlotlyService.plotly) {
  PlotlyService.setPlotly(Plotly);
}

@Component({
  selector: 'app-scatter-plot-three-dimensions',
  imports: [
    PlotlyModule
  ],
  providers: [
    PlotlyService
  ],
  template: `
    <plotly-plot
      [data]="plotData"
      [layout]="plotLayout"
      [config]="{responsive: true}"
    ></plotly-plot>
  `
})
export class ScatterPlotThreeDimensionsComponent {
  @Input() data: any;
  plotData = [{
    x: [1, 2, 3, 4, 5, 6],
    y: [10, 15, 8, 12, 20, 14],
    z: [5, 8, 3, 12, 7, 11],
    mode: 'markers',
    type: 'scatter3d',
    marker: {
      size: 8,
      color: [10, 20, 30, 40, 50, 60],
      colorscale: 'Viridis',
      opacity: 0.8
    },
    name: 'Metrics'
  }];

  plotLayout = {
    title: '3 Related Metrics (X, Y, Z)',
    scene: {
      xaxis: { title: 'Metric A' },
      yaxis: { title: 'Metric B' },
      zaxis: { title: 'Metric C' },
      aspectmode: 'cube'
    },
    margin: { l: 0, r: 0, b: 0, t: 50 }
  };
}