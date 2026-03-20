// Port of flowchart_handler.ts — without Angular.
import type { TFlowchartHandlerData } from '../../types';
import { Flowchart } from './Flowchart';

export class FlowchartManager {
  private _flowcharts: Flowchart[] = [];
  private _activeIndex = 0;
  data: TFlowchartHandlerData;

  constructor(data: TFlowchartHandlerData) {
    this.data = data;
    this._build();
  }

  update(data: TFlowchartHandlerData): void {
    this.data = data;
    this._build();
  }

  getFlowcharts(): Flowchart[] {
    return this._flowcharts;
  }

  getActive(): Flowchart | undefined {
    return this._flowcharts[this._activeIndex];
  }

  getActiveIndex(): number {
    return this._activeIndex;
  }

  setActiveIndex(index: number): void {
    if (index >= 0 && index < this._flowcharts.length) {
      this._activeIndex = index;
    }
  }

  next(): void {
    if (this._activeIndex < this._flowcharts.length - 1) {
      this._activeIndex++;
    }
  }

  prev(): void {
    if (this._activeIndex > 0) {
      this._activeIndex--;
    }
  }

  private _build(): void {
    this._flowcharts = (this.data.flowcharts ?? []).map((d) => new Flowchart(d));
    if (this._activeIndex >= this._flowcharts.length) {
      this._activeIndex = 0;
    }
  }
}
