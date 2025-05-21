import React from "react";
import { Steps } from "@cloudscape-design/components";

interface FlowSimulatorProps {
    content: any;
}

const FlowSimulator: React.FC<FlowSimulatorProps> = ({ content }) => {
    const flowmap = new Map<string, any>();
    content.Actions.forEach((action: any) => {
        flowmap.set(action.Identifier, action);
    });

    const visited = new Set();
    const steps: any[] = [];

    let node = flowmap.get(content.StartAction);

    while (node && !visited.has(node.Identifier)) {
        visited.add(node.Identifier);

        steps.push({
            status: "success",
            title: `${node.Type}`,
            content: (
                <div>
                    <strong>ID:</strong> {node.Identifier}
                    {node.Parameters && (
                        <pre>{JSON.stringify(node.Parameters, null, 2)}</pre>
                    )}
                </div>
            ),
        });

        const nextId = node.Transitions?.NextAction;
        node = flowmap.get(nextId);
    }

    if (node && !visited.has(node.Identifier)) {
        steps.push({
            status: "success",
            title: `${node.Type}`,
            content: <p>{node.Type}</p>,
        });
    }

    return <Steps steps={steps} />;
};

export default FlowSimulator;
