import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Text } from 'react-native';

// ✅ 기범님이 만든 파일들 정확한 경로로 임포트
import HomeScreen from '../src/screens/HomeScreen';
import LoginScreen from '../src/screens/LoginScreen';
import ReportScreen from '../src/screens/ReportScreen';
import SignupScreen from '../src/screens/SignupScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// 1. 메인 화면 (하단 탭 구조)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { height: 70, paddingBottom: 10 },
        tabBarActiveTintColor: '#3182F6',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          tabBarLabel: '실시간', 
          tabBarIcon: ({ focused }) => <Text>{focused ? '🏠' : '🏡'}</Text> 
        }} 
      />
      <Tab.Screen 
        name="Report" 
        component={ReportScreen} 
        options={{ 
          tabBarLabel: '리포트', 
          tabBarIcon: ({ focused }) => <Text>{focused ? '📊' : '📈'}</Text> 
        }} 
      />
    </Tab.Navigator>
  );
}

// 2. 전체 내비게이션 시작점
export default function App() {
  return (
    <Stack.Navigator initialRouteName="Login">
      {/* 로그인 */}
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }} 
      />
      {/* 회원가입 */}
      <Stack.Screen 
        name="Signup" 
        component={SignupScreen} 
        options={{ title: '회원가입' }} 
      />
      {/* 메인 콘텐츠 (탭 내비게이션) */}
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs} 
        options={{ headerShown: false }} 
      />
    </Stack.Navigator>
  );
}