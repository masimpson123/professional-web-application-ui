import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScatterPlotXyzComponent } from './scatter-plot-xyz.component';

describe('ScatterPlotXyzComponent', () => {
  let component: ScatterPlotXyzComponent;
  let fixture: ComponentFixture<ScatterPlotXyzComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScatterPlotXyzComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScatterPlotXyzComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
