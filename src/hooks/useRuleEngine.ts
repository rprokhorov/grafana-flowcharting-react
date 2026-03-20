import { useRef, useEffect } from 'react';
import type { TIRulesHandlerData } from '../types';
import { RuleEngine } from '../core/rules/RuleEngine';

/**
 * Creates and updates a RuleEngine from the panel options.
 * Returns a stable RuleEngine reference.
 */
export function useRuleEngine(rulesData: TIRulesHandlerData): RuleEngine {
  const engineRef = useRef<RuleEngine | null>(null);

  if (engineRef.current === null) {
    engineRef.current = new RuleEngine(rulesData);
  }

  useEffect(() => {
    engineRef.current!.update(rulesData);
  }, [rulesData]);

  return engineRef.current;
}
