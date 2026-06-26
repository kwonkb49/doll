import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

// 1. 테마 컨텍스트에서 넘겨줄 데이터 타입 정의
interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

// 2. 컨텍스트 대문 개방
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 3. 앱 전체에 테마 신호를 뿌려주는 Provider 공급자 컴포넌트
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  // 시스템 테마가 변경되면 자동으로 앱 테마도 맞춰줌
  useEffect(() => {
    setIsDarkMode(systemColorScheme === 'dark');
  }, [systemColorScheme]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 4. 💡 다른 파일에서 한 줄로 쉽게 꺼내 쓸 수 있도록 훅(Hook)을 정의하고 기본 내보내기(default)
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme은 ThemeProvider 내부에서만 사용할 수 있습니다.');
  }
  return context;
};

export default useTheme; // 👈 HomeScreen 등에서 import useTheme로 편하게 쓰기 위함