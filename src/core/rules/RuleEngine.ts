// Port of RulesHandler from src/rules_handler.ts — Angular removed.

import type { TIRulesHandlerData } from '../../types';
import type { MetricProcessor } from '../metrics/MetricProcessor';
import type { XCell } from '../drawio/XCell';
import type { XGraph } from '../drawio/XGraph';
import { Rule } from './Rule';

export interface CellRuleMatch {
  level: number;
  color: string;
  formattedValue: string;
  rawValue: string | number | null;
  ruleAlias: string;
  metricPattern: string;
}

export interface CellRuleState {
  cellId: string;
  /** Highest-level match (used for visual styling) */
  level: number;
  color: string;
  formattedValue: string;
  rawValue: string | number | null;
  ruleAlias: string;
  /** All rules that matched this cell (for multi-series tooltip) */
  allMatches: CellRuleMatch[];
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

      // Find xcells matching this rule's shape/text/link/event maps.
      // Each map group carries its own options (identByProp / regex / metadata),
      // so we must match using the group's options — not shapes' for all.
      const affectedCells = new Set<XCell>();
      const maps = rule.data.mapsDat;
      for (const group of [maps.shapes, maps.texts, maps.links, maps.events]) {
        for (const mapData of group.dataList) {
          const cells = xgraph.findXCells(mapData.pattern, group.options);
          for (const c of cells) {
            affectedCells.add(c);
          }
        }
      }

      // Apply maps
      rule.applyMapsToXCells(xgraph, xcells, result);

      // Update state map — collect all matches, keep highest-level for styling
      const match: CellRuleMatch = {
        level: result.level,
        color: result.color,
        formattedValue: result.formattedValue,
        rawValue: result.rawValue,
        ruleAlias: rule.data.alias,
        metricPattern: rule.data.pattern,
      };

      for (const xcell of affectedCells) {
        const existing = stateMap.get(xcell.getId());
        if (!existing) {
          stateMap.set(xcell.getId(), {
            cellId: xcell.getId(),
            level: result.level,
            color: result.color,
            formattedValue: result.formattedValue,
            rawValue: result.rawValue,
            ruleAlias: rule.data.alias,
            allMatches: [match],
          });
        } else {
          existing.allMatches.push(match);
          if (result.level > existing.level) {
            existing.level = result.level;
            existing.color = result.color;
            existing.formattedValue = result.formattedValue;
            existing.rawValue = result.rawValue;
            existing.ruleAlias = rule.data.alias;
          }
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
