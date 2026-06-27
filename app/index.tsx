import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 🔌 스크린 컴포넌트 로드
import HomeScreen from '../src/screens/HomeScreen';
import LoginScreen from '../src/screens/LoginScreen';
import ReportScreen from '../src/screens/ReportScreen';
import SettingScreen from '../src/screens/SettingScreen';
import SignupScreen from '../src/screens/SignupScreen';

// 🎨 [핵심 수정] ThemeProvider를 중괄호 { ThemeProvider } 형태로 명확하게 가져옵니다!
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { COLORS, getTheme } from '../src/screens/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ route }: any) {
  const { isDarkMode } = useTheme();
  const theme = getTheme(isDarkMode);
  
  const rawRole = route?.params?.role || 'parent';
  const userRole = rawRole.toLowerCase() === 'teacher' ? 'teacher' : 'parent';
  const accent = userRole === 'parent' ? COLORS.primary : COLORS.secondary;

  const tabBarStyle = {
    backgroundColor: theme.card,
    borderTopColor: theme.border,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 66,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 10,
    elevation: 0,
    shadowOpacity: 0,
  };

  const tabBarOptions = {
    headerShown: false,
    tabBarStyle,
    tabBarLabelStyle: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.2, marginTop: 2 },
    tabBarInactiveTintColor: COLORS.textMuted,
    tabBarActiveTintColor: accent,
  };

  if (userRole === 'parent') {
    return (
      <Tab.Navigator screenOptions={tabBarOptions}>
        <Tab.Screen
          name="ParentHome"
          component={HomeScreen}
          initialParams={{ role: 'parent' }}
          options={{ title: '홈', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} /> }}
        />
        <Tab.Screen
          name="ParentReport"
          component={ReportScreen}
          options={{ title: '리포트', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={22} color={color} /> }}
        />
        <Tab.Screen
          name="ParentSetting"
          component={SettingScreen}
          initialParams={{ role: 'parent' }}
          options={{ title: '설정', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={color} /> }}
        />
      </Tab.Navigator>
    );
  }

  return (
    <Tab.Navigator screenOptions={tabBarOptions}>
      <Tab.Screen
        name="TeacherHome"
        component={HomeScreen}
        initialParams={{ role: 'teacher' }}
        options={{ title: '아동 관리', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'people' : 'people-outline'} size={22} color={color} /> }}
      />
      <Tab.Screen
        name="TeacherSetting"
        component={SettingScreen}
        initialParams={{ role: 'teacher' }}
        options={{ title: '설정', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={color} /> }}
      />
    </Tab.Navigator>
  );
}

function RoleSelectScreen({ navigation }: any) {
  const { isDarkMode } = useTheme();
  const theme = getTheme(isDarkMode);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.logoArea}>
        <View style={[styles.logoMark, { backgroundColor: isDarkMode ? '#1E293B' : COLORS.primaryLight }]}>
          <Ionicons name="heart" size={28} color={COLORS.primary} />
        </View>
        <Text style={[styles.appName, { color: theme.text }]}>마음이음</Text>
        <Text style={[styles.appDesc, { color: theme.subText }]}>자폐 아동 감정 케어 플랫폼</Text>
      </View>

      <View style={styles.cardArea}>
        <Text style={[styles.sectionLabel, { color: COLORS.textMuted }]}>어떤 역할로 시작하시나요?</Text>

        <TouchableOpacity
          style={[styles.roleCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('Login', { role: 'parent' })}
          activeOpacity={0.85}
        >
          <View style={[styles.roleIconWrap, { backgroundColor: COLORS.primaryLight }]}>
            <Ionicons name="heart-outline" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.roleTextWrap}>
            <Text style={[styles.roleTitle, { color: theme.text }]}>보호자</Text>
            <Text style={[styles.roleSubtitle, { color: theme.subText }]}>아이의 감정 리포트 확인</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('Login', { role: 'teacher' })}
          activeOpacity={0.85}
        >
          <View style={[styles.roleIconWrap, { backgroundColor: COLORS.secondaryLight }]}>
            <Ionicons name="people-outline" size={24} color={COLORS.secondary} />
          </View>
          <View style={styles.roleTextWrap}>
            <Text style={[styles.roleTitle, { color: theme.text }]}>보호사 · 선생님</Text>
            <Text style={[styles.roleSubtitle, { color: theme.subText }]}>아동 감정 상태 관리</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.footerNote, { color: COLORS.textMuted }]}>
        처음 사용하신다면{' '}
        <Text style={{ color: COLORS.primary, fontWeight: '600' }} onPress={() => navigation.navigate('Signup')}>
          회원가입
        </Text>
        이 필요합니다.
      </Text>
    </View>
  );
}

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
  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  logoArea: { alignItems: 'center', marginBottom: 52 },
  logoMark: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  appName: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5, marginBottom: 6 },
  appDesc: { fontSize: 14, letterSpacing: 0.1 },
  cardArea: { gap: 12 },
  sectionLabel: { fontSize: 13, fontWeight: '500', marginBottom: 4, letterSpacing: 0.2 },
  roleCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 18, borderWidth: 1, gap: 14 },
  roleIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  roleTextWrap: { flex: 1, gap: 3 },
  roleTitle: { fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
  roleSubtitle: { fontSize: 13 },
  footerNote: { marginTop: 36, textAlign: 'center', fontSize: 13 },
});