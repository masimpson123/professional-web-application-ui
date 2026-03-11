import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScatterPlotThreeDimensionsComponent } from './scatter-plot-three-dimensions.component';

describe('ScatterPlotThreeDimensionsComponent', () => {
  let component: ScatterPlotThreeDimensionsComponent;
  let fixture: ComponentFixture<ScatterPlotThreeDimensionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScatterPlotThreeDimensionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScatterPlotThreeDimensionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
