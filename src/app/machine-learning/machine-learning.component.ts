import { NgComponentOutlet } from '@angular/common';
import { Component, ElementRef, Type, ViewChild, effect, signal } from '@angular/core';
import { form, Field, min, max, disabled } from '@angular/forms/signals';
import { ThreeDimensionalData } from '../common-models/common-models';
import { DemoHeaderComponent } from '../demo-header/demo-header.component';
import { environment } from '../../environments/environment';

// Matches --slate and --signal in styles.css: observed data is slate, model output is signal.
const DATA_COLOR = '#5e7a8a';
const PREDICTION_COLOR = '#d2401e';

@Component({
  selector: 'app-machine-learning',
  imports: [Field, NgComponentOutlet, DemoHeaderComponent],
  templateUrl: './machine-learning.component.html',
  styleUrl: './machine-learning.component.css',
})
export class MachineLearningComponent {
  @ViewChild('univariatelinearregressiongraph') univariateLinearRegressionGraph!: ElementRef<HTMLInputElement>;
  @ViewChild('univariatetrainingreport') univariateTrainingReportGraph!: ElementRef<HTMLInputElement>;
  @ViewChild('multivariatetrainingreport') multivariateTrainingReportGraph!: ElementRef<HTMLInputElement>;
  apiUrl = environment.expressApiUrl;
  univariateModelIsTraining = false;
  univariateData: LinearRegressionPoint[]|null = null;
  univariateTrainingReport = null;
  univariateTrainingRequired = true;
  multivariateTrainingData: number[][]|null = null;
  multivariateTrainingReport = null;
  multivariateModelIsTraining = false;
  multivariateTrainingRequired = signal(true);
  revenuePredictionModel = signal<RevenueData>({
    price: 3,
    temperature: 80
  });
  revenuePredictionForm = form(this.revenuePredictionModel, (schemaPath) => {
    min(schemaPath.price, 1, { message: 'Enter a price of at least $1.' });
    max(schemaPath.price, 10, { message: 'Enter a price of $10 or less.' });
    min(schemaPath.temperature, 55, { message: 'Enter a temperature of at least 55 °F.' });
    max(schemaPath.temperature, 100, { message: 'Enter a temperature of 100 °F or less.' });
    disabled(schemaPath.price, this.multivariateTrainingRequired);
    disabled(schemaPath.temperature, this.multivariateTrainingRequired);
  });
  prediction: string|null = null;
  multivariateScatterPlotData: ThreeDimensionalData[][]|null = null;
  multivariateScatterPlotSeriesNames: string[]|null = null;
  multivariateScatterPlotSeriesColors: string[]|null = null;
  multivariatePredictions: MultiVariatePrediction[]|null = null;
  scatterPlotXyzComponent: Type<unknown>|null = null;
  constructor() {
    effect(() => {
      const price = this.revenuePredictionModel().price;
      const temperature = this.revenuePredictionModel().temperature;
      if (!this.multivariatePredictions) return;
      this.updatePredictionMessage(this.multivariatePredictions, price, temperature);
    });
  }
  private async ensureScatterPlotLoaded() {
    if (this.scatterPlotXyzComponent) return;
    const { ScatterPlotXyzComponent } = await import('../scatter-plot-xyz/scatter-plot-xyz.component');
    this.scatterPlotXyzComponent = ScatterPlotXyzComponent;
  }
  private async tfvis() {
    const m = await import('@tensorflow/tfjs-vis');
    return (m as any).default ?? m;
  }
  generateRenderUnivariateTrainingData() {
    this.univariateTrainingRequired = true;
    this.univariateTrainingReport = null;
    this.univariateTrainingReportGraph.nativeElement.innerHTML = '';
    const positiveDirection = Math.random() > .5;
    this.univariateData =
      new Array(100)
        .fill(0)
        .map((_, index) => ({
          input: index + (((30 - index) * Math.max(.4, Math.random()))), // x
          label: (((positiveDirection ? (100 - index) : index) ** 2) + (2000 * Math.random())) / 100 // y
        }));
    this.renderScatterPlot(
      this.univariateData,
      [],
      [DATA_COLOR, PREDICTION_COLOR],
      ['Training data', 'Predictions']
    );
  }
  trainUnivariateModelRenderTrainingReport() {
    this.univariateTrainingReport = null;
    this.univariateTrainingReportGraph.nativeElement.innerHTML = '';
    this.univariateModelIsTraining = true;
    fetch(this.apiUrl + 'tensorflow-train-univariate-model', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trainingData: this.univariateData
      })
    })
      .then(async trainingReportResponse => {
        if (!trainingReportResponse.ok) throw new Error(await trainingReportResponse.text());
        return trainingReportResponse.json();
      })
      .then(trainingReport => {
        this.univariateTrainingRequired = false;
        this.univariateModelIsTraining = false;
        this.univariateTrainingReport = trainingReport
        this.tfvis().then(({ show }) => {
          show.history(
            {
              name: 'Training report',
              drawArea: this.univariateTrainingReportGraph.nativeElement
            },
            trainingReport,
            ['loss']);
        });
      })
      .catch(err => {
        this.univariateModelIsTraining = false;
        alert(err.message);
      });
  }
  getRenderUnivariateLinearRegressionPredictions() {
    if (!this.univariateData) return;
    fetch(this.apiUrl + 'tensorflow-get-univariate-linear-regression-predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trainingData: this.univariateData
      })
    })
      .then(async predictionsResponse => {
        if (!predictionsResponse.ok) throw new Error(await predictionsResponse.text());
        return predictionsResponse.json();
      })
      .then(predictions => {
        this.renderScatterPlot(
          this.univariateData!,
          predictions,
          [DATA_COLOR, PREDICTION_COLOR],
          ['Training data', 'Predictions']
        );
      })
      .catch(err => {
        alert(err.message);
      });
  }
  getRenderMultivariateTrainingData() {
    fetch(this.apiUrl + 'tensorflow-get-multivariate-data')
      .then(multivariateDataResponse => multivariateDataResponse.json())
      .then(multivariateTrainingData => {
        this.multivariateTrainingData = multivariateTrainingData;
        this.multivariateScatterPlotData = [
          multivariateTrainingData.map((datum:number[]) =>
            // x: price, y: temperature, z: units sold (vertical)
            ({x: datum[0], y: datum[1], z: datum[2]})
          ),
          []
        ];
        this.multivariateScatterPlotSeriesColors = [DATA_COLOR];
        this.multivariateScatterPlotSeriesNames = ['Training data'];
        void this.ensureScatterPlotLoaded();
      });
  }
  trainMultivariateModelRenderTrainingReport() {
    this.multivariateTrainingReport = null;
    this.multivariateTrainingReportGraph.nativeElement.innerHTML = '';
    this.multivariateModelIsTraining = true;
    fetch(this.apiUrl + 'tensorflow-train-multivariate-model', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trainingData: this.multivariateTrainingData
      })
    })
      .then(async trainingReportResponse => {
        if (!trainingReportResponse.ok) throw new Error(await trainingReportResponse.text());
        return trainingReportResponse.json();
      })
      .then(trainingReport => {
        this.multivariateTrainingRequired.update(() => false)
        this.multivariateModelIsTraining = false;
        this.multivariateTrainingReport = trainingReport
        this.tfvis().then(({ show }) => {
          show.history(
            {
              name: 'Training report',
              drawArea: this.multivariateTrainingReportGraph.nativeElement
            },
            trainingReport,
            ['loss']);
        });
      })
      .catch(err => {
        this.multivariateModelIsTraining = false;
        alert(err.message);
      });
  }
  predictNumberOfUnitsSold() {
    this.prediction = 'Predicting sales…';
    fetch(this.apiUrl + 'tensorflow-get-multivariate-linear-regression-predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trainingData: this.multivariateTrainingData
      })
    })
      .then(async predictionsResponse => {
        if (!predictionsResponse.ok) throw new Error(await predictionsResponse.text());
        return predictionsResponse.json();
      })
      .then(predictions => {
        this.multivariatePredictions = predictions.predictions;
        this.updatePredictionMessage(
          predictions.predictions,
          this.revenuePredictionModel().price,
          this.revenuePredictionModel().temperature
        );
        // x: price, y: temperature, z: units sold (vertical)
        this.multivariateScatterPlotData = [
          this.multivariateTrainingData?.map((datum:number[]) =>
            ({x: datum[0], y: datum[1], z: datum[2]})
          ),
          predictions.predictions.map(
            (prediction: MultiVariatePrediction) =>
              ({x: prediction.feature1, y: prediction.feature2, z: prediction.predictedLabel}))
        ];
        this.multivariateScatterPlotSeriesColors = [DATA_COLOR, PREDICTION_COLOR];
        this.multivariateScatterPlotSeriesNames = ['Training data', 'Predictions'];
        void this.ensureScatterPlotLoaded();
      })
      .catch(err => {
        alert(err.message);
      });
  }
  updatePredictionMessage(
    predictions: MultiVariatePrediction[],
    price: number,
    temperature: number
  ) {
    const prediction =
      predictions.find(
        (prediction: MultiVariatePrediction) =>
        prediction.feature1 === price &&
        prediction.feature2 === temperature
      )?.predictedLabel;
      this.prediction =
        prediction
          ? `Predicted sales: ${prediction} bottles, or ${(prediction * price).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} in revenue.`
          : null;
  }
  renderScatterPlot(
    trainingData: LinearRegressionPoint[],
    predictions: LinearRegressionPoint[],
    seriesColors: string[],
    seriesNames: string[]
  ) {
    this.tfvis().then(({ render }) => {
      render.scatterplot(
        {
          name: 'Predictions and training data',
          drawArea: this.univariateLinearRegressionGraph.nativeElement
        },
        {
          values: [
            trainingData.map(datum => ({x: datum.input, y: datum.label})),
            predictions.map(datum => ({x: datum.input, y: datum.label}))
          ],
          series: seriesNames},
        {
          xLabel: 'Input',
          yLabel: 'Label',
          height: 320,
          fontSize: 13,
          seriesColors
        }
      );
    });
  }
}

interface LinearRegressionPoint {
  input: number;
  label: number;
}

interface RevenueData {
  price: number;
  temperature: number;
}

interface MultiVariatePrediction {
  feature1: number;
  feature2: number;
  predictedLabel: number;
}
