import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 🔌 기존 순정 스크린 파일들 연결
import HomeScreen from '../src/screens/HomeScreen';
import LoginScreen from '../src/screens/LoginScreen';
import ReportScreen from '../src/screens/ReportScreen';
import SettingScreen from '../src/screens/SettingScreen';
import SignupScreen from '../src/screens/SignupScreen';

// 🎨 오리지널 테마 공급자 가져오기
import { ThemeProvider } from '../src/context/ThemeContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/* ==========================================
   1. 👪 [메인 탭 구조] 로그인 후 진입
   ========================================== */
function MainTabs({ route }: any) {
  const userRole = route?.params?.role || 'parent';

  // 👪 보호자용 하단 탭 (홈, 리포트, 설정)
  if (userRole === 'parent') {
    return (
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#3182F6',
          tabBarInactiveTintColor: '#8E8E93',
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="ParentHome"
          component={HomeScreen}
          options={{
            title: '홈',
            tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} />,
          }}
        />
        <Tab.Screen
          name="ParentReport"
          component={ReportScreen}
          options={{
            title: '리포트',
            tabBarIcon: ({ color }) => <Ionicons name="document-text" size={22} color={color} />,
          }}
        />
        <Tab.Screen
          name="ParentSetting"
          component={SettingScreen}
          options={{
            title: '설정',
            tabBarIcon: ({ color }) => <Ionicons name="settings" size={22} color={color} />,
          }}
        />
      </Tab.Navigator>
    );
  }

  // 🧑‍🏫 선생님/보호사용 하단 탭 (홈, 설정)
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="TeacherHome"
        component={HomeScreen}
        options={{
          title: '아동관리',
          tabBarIcon: ({ color }) => <Ionicons name="people" size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="TeacherSetting"
        component={SettingScreen}
        options={{
          title: '설정',
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={22} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

/* ==========================================
   2. 🚪 [초기 역할 선택 화면]
   ========================================== */
function RoleSelectScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>마음이음</Text>
      <Text style={styles.subTitle}>접속하실 유형을 선택해 주세요.</Text>

      <TouchableOpacity
        style={[styles.roleBtn, { backgroundColor: '#3182F6' }]}
        onPress={() => navigation.navigate('Login', { role: 'parent' })}
      >
        <Text style={styles.roleBtnText}>보호자로 시작하기</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.roleBtn, { backgroundColor: '#10B981' }]}
        onPress={() => navigation.navigate('Login', { role: 'teacher' })}
      >
        <Text style={styles.roleBtnText}>보호사로 시작하기</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ==========================================
   3. 🚀 [최상단 네비게이션 배포]
   ========================================== */
export default function App() {
  return (
    <ThemeProvider>
      <Stack.Navigator initialRouteName="RoleSelect">
        <Stack.Screen name="RoleSelect" component={RoleSelectScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F4F6', padding: 24 },
  mainTitle: { fontSize: 26, fontWeight: 'bold', color: '#191F28', marginBottom: 8 },
  subTitle: { fontSize: 15, color: '#4E5968', marginBottom: 40 },
  roleBtn: { width: '100%', padding: 20, borderRadius: 16, marginBottom: 12, alignItems: 'center', justifyContent: 'center' },
  roleBtnText: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
});