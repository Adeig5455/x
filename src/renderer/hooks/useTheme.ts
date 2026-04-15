import { useState, useEffect, useCallback, useMemo } from 'react';
import { themeManager, type ThemeDefinition } from '../themes/themeManager';

export function useTheme() {
  const [currentThemeId, setCurrentThemeId] = useState(themeManager.getCurrentThemeId());
  const [theme, setTheme] = useState<ThemeDefinition>(themeManager.getCurrentTheme());

  useEffect(() => {
    const unsubscribe = themeManager.onChange((id, newTheme) => {
      setCurrentThemeId(id);
      setTheme(newTheme);
    });

    // Initialize theme on mount
    themeManager.initialize();

    return unsubscribe;
  }, []);

  const changeTheme = useCallback((themeId: string) => {
    themeManager.setTheme(themeId);
  }, []);

  const availableThemes = useMemo(() => {
    return themeManager.getAvailableThemes();
  }, []);

  const isDark = theme.type === 'dark';

  const getColor = useCallback(
    (key: string): string => {
      return theme.colors[key] || '';
    },
    [theme]
  );

  const monacoTheme = useMemo(() => {
    return themeManager.getMonacoTheme();
  }, [theme]);

  return {
    theme,
    currentThemeId,
    isDark,
    availableThemes,
    changeTheme,
    getColor,
    monacoTheme,
  };
}
