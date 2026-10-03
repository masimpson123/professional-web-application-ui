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
      <plotly-plot
        [data]="plotData"
        [layout]="layout"
        [config]="{
          responsive: true,
          displayModeBar: false,
          displaylogo: false
        }"
        [useResizeHandler]="true"
        [style]="{ display: 'block', width: '100%', height: '440px' }"
      ></plotly-plot>
    }
  `,
  styleUrl: './scatter-plot-xyz.component.css',
})
export class ScatterPlotXyzComponent {
  @Input() xyzData: ThreeDimensionalData[][]|null = null;
  @Input() seriesColors: string[]|null = null;
  @Input() seriesNames: string[]|null = null;
  plotData:any = [];

  private readonly axis = (text: string) => ({
    title: { text },
    gridcolor: '#d9dfe3',
    zerolinecolor: '#b9c3ca',
    backgroundcolor: '#ffffff',
  });

  // Fonts and grid colors match the tokens in styles.css.
  readonly layout = {
    autosize: true,
    height: 440,
    showlegend: true,
    legend: { itemsizing: 'constant', x: 0, y: 1 },
    font: { family: 'Geist, Helvetica Neue, Arial, sans-serif', size: 13, color: '#1b2730' },
    paper_bgcolor: 'rgba(0,0,0,0)',
    scene: {
      camera: {
        center: { x: 0, y: 0, z: -0.2 },
        eye: { x: 2, y: 1, z: 1 }
      },
      xaxis: this.axis('Price ($)'),
      yaxis: this.axis('Temperature (°F)'),
      zaxis: this.axis('Bottles sold'),
      aspectmode: 'cube'
    },
    margin: { l: 0, r: 0, b: 0, t: 0 },
  };
  ngOnChanges() {
    if (!this.xyzData) return;
    this.plotData = this.xyzData.map((dataSet, index) => ({
      x: dataSet.map(datum => datum.x),
      y: dataSet.map(datum => datum.y),
      z: dataSet.map(datum => datum.z),
      mode: 'markers',
      type: 'scatter3d',
      marker: {
        size: index ? 1.5 : 3,
        color: this.seriesColors ? this.seriesColors[index] : '#5e7a8a',
        colorscale: 'Viridis',
        opacity: 1
      },
      name: this.seriesNames ? this.seriesNames[index] : 'Series ' + index
    }));
  }
}
