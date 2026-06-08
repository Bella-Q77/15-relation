import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

export type ThemeMode = 'dark' | 'light';

export interface ThemeTokens {
  bg: string;
  bgPanel: string;
  bgGraph: string;
  bgDragBar: string;
  bgStatusBar: string;
  bgHover: string;
  bgCard: string;
  bgInput: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  textDim: string;
  border: string;
  borderInput: string;
  primary: string;
  primaryBg: string;
  scrollThumb: string;
  scrollThumbHover: string;
  selection: string;
  shadow: string;
  shadowPanel: string;
  graphNodeLabel: string;
  graphNodeLabelDim: string;
  graphEdgeLabel: string;
  graphEdgeLabelDim: string;
  minimapBg: string;
}

const darkTokens: ThemeTokens = {
  bg: '#1a1d23',
  bgPanel: 'rgba(26,29,35,0.95)',
  bgGraph: '#12141a',
  bgDragBar: 'linear-gradient(180deg, rgba(30,34,42,0.95) 0%, rgba(26,29,35,0.95) 100%)',
  bgStatusBar: 'rgba(30,34,42,0.9)',
  bgHover: 'rgba(255,255,255,0.05)',
  bgCard: 'rgba(255,255,255,0.03)',
  bgInput: 'rgba(255,255,255,0.05)',
  text: '#e0e0e0',
  textSecondary: 'rgba(255,255,255,0.8)',
  textTertiary: 'rgba(255,255,255,0.45)',
  textMuted: 'rgba(255,255,255,0.3)',
  textDim: 'rgba(255,255,255,0.2)',
  border: 'rgba(255,255,255,0.06)',
  borderInput: 'rgba(255,255,255,0.08)',
  primary: '#4f6ef7',
  primaryBg: 'rgba(79,110,247,0.15)',
  scrollThumb: 'rgba(255,255,255,0.12)',
  scrollThumbHover: 'rgba(255,255,255,0.2)',
  selection: 'rgba(79,110,247,0.3)',
  shadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
  shadowPanel: '0 2px 8px rgba(0,0,0,0.3)',
  graphNodeLabel: '#e0e0e0',
  graphNodeLabelDim: 'rgba(255,255,255,0.25)',
  graphEdgeLabel: 'rgba(255,255,255,0.55)',
  graphEdgeLabelDim: 'rgba(255,255,255,0.18)',
  minimapBg: 'rgba(30,34,42,0.92)',
};

const lightTokens: ThemeTokens = {
  bg: '#f0f2f5',
  bgPanel: '#ffffff',
  bgGraph: '#f7f8fa',
  bgDragBar: 'linear-gradient(180deg, #e8eaed 0%, #dfe1e5 100%)',
  bgStatusBar: '#e8eaed',
  bgHover: 'rgba(0,0,0,0.04)',
  bgCard: 'rgba(0,0,0,0.02)',
  bgInput: 'rgba(0,0,0,0.03)',
  text: '#1f1f1f',
  textSecondary: 'rgba(0,0,0,0.75)',
  textTertiary: 'rgba(0,0,0,0.45)',
  textMuted: 'rgba(0,0,0,0.35)',
  textDim: 'rgba(0,0,0,0.2)',
  border: 'rgba(0,0,0,0.08)',
  borderInput: 'rgba(0,0,0,0.15)',
  primary: '#4f6ef7',
  primaryBg: 'rgba(79,110,247,0.08)',
  scrollThumb: 'rgba(0,0,0,0.15)',
  scrollThumbHover: 'rgba(0,0,0,0.25)',
  selection: 'rgba(79,110,247,0.2)',
  shadow: '0 1px 0 rgba(0,0,0,0.04)',
  shadowPanel: '0 2px 8px rgba(0,0,0,0.08)',
  graphNodeLabel: '#333',
  graphNodeLabelDim: '#aaa',
  graphEdgeLabel: '#666',
  graphEdgeLabelDim: '#bbb',
  minimapBg: '#ffffff',
};

const THEME_STORAGE_KEY = 'relationship-analyzer-theme';

interface ThemeContextValue {
  mode: ThemeMode;
  tokens: ThemeTokens;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  tokens: darkTokens,
  setMode: () => {},
  toggle: () => {},
});

function applyCSSSVariables(tokens: ThemeTokens) {
  const root = document.documentElement;
  root.style.setProperty('--bg', tokens.bg);
  root.style.setProperty('--bg-graph', tokens.bgGraph);
  root.style.setProperty('--scroll-thumb', tokens.scrollThumb);
  root.style.setProperty('--scroll-thumb-hover', tokens.scrollThumbHover);
  root.style.setProperty('--selection', tokens.selection);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'light';
  });

  const tokens = useMemo(() => (mode === 'dark' ? darkTokens : lightTokens), [mode]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, m);
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  useEffect(() => {
    applyCSSSVariables(tokens);
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode, tokens]);

  const value = useMemo(() => ({ mode, tokens, setMode, toggle }), [mode, tokens, setMode, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
