"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useBusinessStore } from './store';

export const BusinessStoreContext = createContext<ReturnType<typeof useBusinessStore> | null>(null);

export function BusinessStoreProvider({ children }: { children: ReactNode }) {
  const store = useBusinessStore();
  return <BusinessStoreContext.Provider value={store}>{children}</BusinessStoreContext.Provider>;
}

export const useBusinessStoreContext = () => {
  const context = useContext(BusinessStoreContext);
  if (!context) throw new Error('useBusinessStoreContext must be used within BusinessStoreProvider');
  return context;
};