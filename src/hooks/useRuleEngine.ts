import { useRef, useEffect, useState } from 'react';
import type { TIRulesHandlerData } from '../types';
import { RuleEngine } from '../core/rules/RuleEngine';

/**
 * Creates and updates a RuleEngine from the panel options.
 * Returns the stable RuleEngine reference AND a revision counter that
 * increments on every rules change — so dependents can react to mutations.
 */
export function useRuleEngine(rulesData: TIRulesHandlerData): { ruleEngine: RuleEngine; rulesRevision: number } {
  const engineRef = useRef<RuleEngine | null>(null);
  const [rulesRevision, setRulesRevision] = useState(0);

  if (engineRef.current === null) {
    engineRef.current = new RuleEngine(rulesData);
  }

  useEffect(() => {
    engineRef.current!.update(rulesData);
    setRulesRevision((v) => v + 1);
  }, [rulesData]);

  return { ruleEngine: engineRef.current, rulesRevision };
}
