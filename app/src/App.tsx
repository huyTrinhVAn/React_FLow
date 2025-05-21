import React, { useState } from "react";
import ContactFlowSelect from "./components/ContactFlowSelect";
import { describeContactFlow } from "./api/connectService";
import FlowSimulator from "./components/FlowSimulator";

const App: React.FC = () => {
  const env = "nonprod";
  const instanceId = "abe310a8-d643-4b43-9b70-53191e315071";

  const [flowDetail, setFlowDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (flowId: string) => {
    setFlowDetail(null);
    setError(null);
    setLoading(true);

    try {
      const response = await describeContactFlow(env, instanceId, flowId);
      setFlowDetail(response);
    } catch (err) {
      console.error("Error with handleSelect:", err);
      setError("Failed to load flow.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🔽 Select a Contact Flow</h2>
      <ContactFlowSelect
        env={env}
        instanceId={instanceId}
        onSelect={handleSelect}
      />

      {loading && <p>Loading flow detail...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && flowDetail?.Content && (
        <div style={{ marginTop: 30 }}>
          <FlowSimulator content={flowDetail.Content} />
        </div>
      )}

      {!loading && flowDetail && (
        <div style={{ marginTop: 20 }}>
          <h3>🧾 Raw Flow Detail</h3>
          <pre>{JSON.stringify(flowDetail, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default App;
