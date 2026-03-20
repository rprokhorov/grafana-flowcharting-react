// Port of flowchart_class.ts data model — without Angular/lifecycle.
import type { TFlowchartData, TSourceTypeKeys } from '../../types';

export class Flowchart {
  data: TFlowchartData;

  constructor(data: TFlowchartData) {
    this.data = data;
  }

  get name(): string {
    return this.data.name;
  }

  get type(): TSourceTypeKeys {
    return this.data.type;
  }

  get source(): string {
    return this.data.type === 'csv' ? this.data.csv : this.data.xml;
  }

  set source(value: string) {
    if (this.data.type === 'csv') {
      this.data.csv = value;
    } else {
      this.data.xml = value;
    }
  }

  get download(): boolean {
    return this.data.download;
  }

  get url(): string {
    return this.data.url;
  }
}
