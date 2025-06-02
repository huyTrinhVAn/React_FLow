import React, { createContext, useContext, useState } from "react";

export interface QueueInfo {
  queueName: string;
  queueArn: string;
}

interface QueueInfoContextType {
  queueInfo: QueueInfo;
  setQueueInfo: (info: QueueInfo) => void;
}

const QueueInfoContext = createContext<QueueInfoContextType | undefined>(undefined);

export const QueueInfoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queueInfo, setQueueInfo] = useState<QueueInfo>({ queueName: "N/A", queueArn: "N/A" });

  return (
    <QueueInfoContext.Provider value={{ queueInfo, setQueueInfo }}>
      {children}
    </QueueInfoContext.Provider>
  );
};

export const useQueueInfo = () => {
  const context = useContext(QueueInfoContext);
  if (!context) {
    throw new Error("useQueueInfo must be used within a QueueInfoProvider");
  }
  return context;
};
