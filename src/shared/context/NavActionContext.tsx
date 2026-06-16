import { createContext, useCallback, useContext, useEffect } from 'react';

interface NavActionContextType {
  registerScrollToTop: (screenId: string, fn: () => void) => () => void;
}

const NavActionContext = createContext<NavActionContextType>({
  registerScrollToTop: () => () => {},
});

export const useNavActions = () => useContext(NavActionContext);

export function NavActionProvider({
  registerScrollToTop,
  children,
}: {
  registerScrollToTop: (screenId: string, fn: () => void) => () => void;
  children: React.ReactNode;
}) {
  const value = { registerScrollToTop: useCallback(registerScrollToTop, [registerScrollToTop]) };
  return (
    <NavActionContext.Provider value={value}>
      {children}
    </NavActionContext.Provider>
  );
}

export function useRegisterScrollToTop(screenId: string, scrollRef: React.RefObject<any>) {
  const { registerScrollToTop } = useNavActions();
  useEffect(() => {
    return registerScrollToTop(screenId, () => {
      const el = scrollRef.current;
      if (!el) return;
      if (typeof el.scrollTo === 'function') {
        el.scrollTo({ y: 0, animated: true });
      } else if (typeof el.scrollToOffset === 'function') {
        el.scrollToOffset({ offset: 0, animated: true });
      } else if (typeof el.scrollToIndex === 'function') {
        el.scrollToIndex({ index: 0, animated: true });
      }
    });
  }, [registerScrollToTop, screenId, scrollRef]);
}
