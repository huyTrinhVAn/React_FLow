import React, { useEffect, useState } from "react";
import Select from "@cloudscape-design/components/select";
import type { SelectProps } from "@cloudscape-design/components/select";

interface FlowSimulatorProps {
  StartAction: string;
  Actions: any[];
}

const FlowSimulator: React.FC<FlowSimulatorProps> = ({ StartAction, Actions }) => {
  const [flowMap, setFlowMap] = useState<Map<string, any>>(new Map());
  const [sections, setSections] = useState<any[][]>([[]]);
  const [activeNode, setActiveNode] = useState<any | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SelectProps.Option | null>(null);

  useEffect(() => {
    const map = new Map<string, any>();
    Actions.forEach((action) => {
      map.set(action.Identifier, action);
    });
    setFlowMap(map);
    setSections([[]]);
    setActiveNode(map.get(StartAction));
    setIsPaused(false);
  }, [StartAction, Actions]);

  useEffect(() => {
    if (!isPaused && activeNode) {
      setSections((prevSections) => {
        const newSections = [...prevSections];
        const currentSection = [...newSections[newSections.length - 1], activeNode];
        newSections[newSections.length - 1] = currentSection;
        return newSections;
      });

      if (activeNode.Transitions?.Conditions) {
        setIsPaused(true);
      } else if (activeNode.Transitions?.NextAction) {
        setActiveNode(flowMap.get(activeNode.Transitions.NextAction));
      } else {
        setActiveNode(null);
      }
    }
  }, [activeNode, isPaused, flowMap]);

  const handleCondition = (condition: SelectProps.Option) => {
    setIsPaused(false);
    setSelectedOption(null);
    setSections((prevSections) => [...prevSections, []]);
    if (activeNode)
      setActiveNode(flowMap.get(condition.value));
  };

  return (
    <div>
      <h3>🧭 Flow Simulator</h3>

      {sections.map((section, sectionIndex) => {
        const lastItem = section[section.length - 1];
        return (
          <div key={sectionIndex} style={{ marginBottom: 20 }}>
            <strong>Section {sectionIndex + 1}</strong>
            <ul>
              {section.map((node, index) => (
                <li key={index}>
                  <strong>{node.Type}</strong> — {node.Identifier}
                </li>
              ))}
            </ul>
            {isPaused && lastItem?.Transitions?.Conditions && sectionIndex === sections.length - 1 && (
              <Select
                selectedOption={selectedOption}
                onChange={({ detail }) => {
                  setSelectedOption(detail.selectedOption);
                  handleCondition(detail.selectedOption);
                }}
                options={lastItem.Transitions.Conditions.map((condition: any, i: number) => ({
                  label: condition.Condition?.Operands?.[0] || `Condition ${i + 1}`,
                  value: condition.NextAction
                }))}
                placeholder="Select a condition"
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FlowSimulator;
