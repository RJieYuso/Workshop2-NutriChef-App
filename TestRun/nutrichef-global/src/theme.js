// Theme colors for light and dark modes
export const lightTheme = {
    background: '#FFFFFF',
    surface: '#F7FAFC',
    primary: '#4299E1',
    secondary: '#48BB78',
    text: '#2D3748',
    textSecondary: '#4A5568',
    textTertiary: '#718096',
    border: '#E2E8F0',
    borderLight: '#F0F0F0',
    error: '#E53E3E',
    success: '#48BB78',
    warning: '#ED8936',
    cardBackground: '#F7FAFC',
    inputBackground: '#FFFFFF',
    statusBarStyle: 'dark-content',
};

export const darkTheme = {
    background: '#1A202C',
    surface: '#2D3748',
    primary: '#63B3ED',
    secondary: '#68D391',
    text: '#F7FAFC',
    textSecondary: '#E2E8F0',
    textTertiary: '#CBD5E0',
    border: '#4A5568',
    borderLight: '#2D3748',
    error: '#FC8181',
    success: '#68D391',
    warning: '#F6AD55',
    cardBackground: '#2D3748',
    inputBackground: '#4A5568',
    statusBarStyle: 'light-content',
};

export const getTheme = (isDark) => isDark ? darkTheme : lightTheme;
