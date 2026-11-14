import React, { createContext, useContext } from 'react';

export type TabMenuContextValue = {
  openMenu: () => void;
};

const TabMenuContext = createContext<TabMenuContextValue | null>(null);

export function TabMenuProvider({
  value,
  children,
}: {
  value: TabMenuContextValue;
  children: React.ReactNode;
}) {
  return <TabMenuContext.Provider value={value}>{children}</TabMenuContext.Provider>;
}

export function useTabMenuOptional(): TabMenuContextValue | null {
  return useContext(TabMenuContext);
}
