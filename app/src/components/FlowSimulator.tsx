import React from "react";
import { Steps } from "@cloudscape-design/components";

interface FlowSimulatorProps {
  StartAction: string;
  Actions: any[];
}

/**
 * FlowSimulator component for AWS Connect Contact Flow JSON.
 * Parses and renders each action step from StartAction through Transitions.
 */
const FlowSimulator: React.FC<FlowSimulatorProps> = ({ StartAction, Actions }) => {
  const flowMap = new Map<string, any>();
  Actions.forEach((action) => {
    flowMap.set(action.Identifier, action);
  });

  const steps: any[] = [];
  const visited = new Set<string>();
  let currentNode = flowMap.get(StartAction);

  while (currentNode && !visited.has(currentNode.Identifier)) {
    visited.add(currentNode.Identifier);

    const next = currentNode.Transitions?.NextAction;
    const errors = currentNode.Transitions?.Errors;

    const block = (
      <div>
        <p><strong>ID:</strong> {currentNode.Identifier}</p>
        <p><strong>Type:</strong> {currentNode.Type}</p>
        {currentNode.Parameters && Object.keys(currentNode.Parameters).length > 0 && (
          <div>
            <strong>Parameters:</strong>
            <pre>{JSON.stringify(currentNode.Parameters, null, 2)}</pre>
          </div>
        )}
        {errors && errors.length > 0 && (
          <div>
            <strong>Error Transitions:</strong>
            <ul>
              {errors.map((err: any, index: number) => (
                <li key={index}>
                  {err.ErrorType}: <code>{err.NextAction}</code>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );

    steps.push({
      status: "success",
      title: currentNode.Type,
      content: block,
    });

    currentNode = next ? flowMap.get(next) : null;
  }

  return (
    <div style={{ marginTop: 20 }}>
      <h3>📞 Simulated Contact Flow (AWS)</h3>
      <Steps steps={steps} />
    </div>
  );
};

export default FlowSimulator;