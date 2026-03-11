import React, { createContext, useContext } from "react";
import { useMockData, MockData } from "@/hooks/useMockData";

const DataContext = createContext<MockData | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const data = useMockData();
  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
