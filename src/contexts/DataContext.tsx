import React, { createContext, useContext } from "react";
import { useApiData, ApiData } from "@/hooks/useApiData";

const DataContext = createContext<ApiData | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const data = useApiData();
  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
