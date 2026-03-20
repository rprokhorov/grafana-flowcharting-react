// Port of RulesHandler from src/rules_handler.ts — Angular removed.

import type { TIRulesHandlerData } from '../../types';
import type { MetricProcessor } from '../metrics/MetricProcessor';
import type { XCell } from '../drawio/XCell';
import type { XGraph } from '../drawio/XGraph';
import { Rule } from './Rule';

export interface CellRuleState {
  cellId: string;
  level: number;
  color: string;
  formattedValue: string;
  rawValue: string | number | null;
  ruleAlias: string;
}

export class RuleEngine {
  private _rules: Rule[] = [];

  constructor(data: TIRulesHandlerData) {
    this._buildRules(data);
  }

  update(data: TIRulesHandlerData): void {
    this._buildRules(data);
  }

  getRules(): Rule[] {
    return this._rules;
  }

  /**
   * Apply all rules to a set of xcells using metrics.
   * Returns a map of cellId → highest-level state.
   */
  applyAll(metrics: MetricProcessor, xgraph: XGraph, xcells: XCell[]): Map<string, CellRuleState> {
    const stateMap = new Map<string, CellRuleState>();

    // Reset all cells to their defaults before applying rules
    for (const xcell of xcells) {
      xcell.restoreAllStyles();
      xcell.restoreLabel();
    }

    // Apply rules in order
    for (const rule of this._rules) {
      if (rule.data.hidden) {
        continue;
      }

      // Find matching metrics
      const matchedMetrics = metrics.matchMetrics(rule.data.pattern);
      if (matchedMetrics.length === 0) {
        continue;
      }

      // Evaluate the rule against the first matching metric
      // (rule pattern typically matches one metric)
      const metric = matchedMetrics[0];
      const result = rule.evaluate(metric);

      // Find xcells matching this rule's shape/text/link maps
      // We collect all xcells that any map targets
      const affectedCells = new Set<XCell>();
      for (const mapData of [
        ...rule.data.mapsDat.shapes.dataList,
        ...rule.data.mapsDat.texts.dataList,
        ...rule.data.mapsDat.links.dataList,
        ...rule.data.mapsDat.events.dataList,
      ]) {
        const cells = xgraph.findXCells(
          mapData.pattern,
          rule.data.mapsDat.shapes.options
        );
        for (const c of cells) {
          affectedCells.add(c);
        }
      }

      // Apply maps
      rule.applyMapsToXCells(xgraph, xcells, result);

      // Update state map with highest-level wins semantics
      for (const xcell of affectedCells) {
        const existing = stateMap.get(xcell.getId());
        if (!existing || result.level > existing.level) {
          stateMap.set(xcell.getId(), {
            cellId: xcell.getId(),
            level: result.level,
            color: result.color,
            formattedValue: result.formattedValue,
            rawValue: result.rawValue,
            ruleAlias: rule.data.alias,
          });
        }
      }
    }

    return stateMap;
  }

  private _buildRules(data: TIRulesHandlerData): void {
    const sorted = [...(data.rulesData ?? [])].sort((a, b) => a.order - b.order);
    this._rules = sorted.map((d) => new Rule(d));
  }
}
