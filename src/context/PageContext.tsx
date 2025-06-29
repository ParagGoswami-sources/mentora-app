import React, { createContext, useState } from "react";
import Animated, { useSharedValue } from "react-native-reanimated";

interface PageContextType {
  pageIndex: number;
  setPageIndex: (index: number) => void;
  translateXAnim: Animated.SharedValue<number>;
}

export const PageContext = createContext<PageContextType | undefined>(
  undefined
);

export const PageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [pageIndex, setPageIndex] = useState(0);
  const translateXAnim = useSharedValue(0);

  return (
    <PageContext.Provider value={{ pageIndex, setPageIndex, translateXAnim }}>
      {children}
    </PageContext.Provider>
  );
};
