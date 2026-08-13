import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { COLORS, getTheme } from '../screens/theme';

export default function SettingScreen({ navigation }: any) {
  const { isDarkMode, toggleTheme } = useTheme();
  const theme = getTheme(isDarkMode);

  // 로컬 스위치 상태
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  // 로그아웃 처리
  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove(['accessToken', 'token', 'user']);
            // Login 화면으로 이동
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          } catch (e) {
            console.error('로그아웃 에러:', e);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* 🔝 상단 헤더 타이틀 */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>설정</Text>
        </View>

        {/* 🎨 1. 화면 및 테마 설정 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.subText }]}>화면 및 서비스</Text>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons
                  name={isDarkMode ? 'moon-outline' : 'sunny-outline'}
                  size={22}
                  color={COLORS.primary}
                />
                <Text style={[styles.rowLabel, { color: theme.text }]}>다크 모드</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.border, true: COLORS.primary + '80' }}
                thumbColor={isDarkMode ? COLORS.primary : '#FFFFFF'}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="notifications-outline" size={22} color={COLORS.primary} />
                <Text style={[styles.rowLabel, { color: theme.text }]}>푸시 알림 수신</Text>
              </View>
              <Switch
                value={isNotificationEnabled}
                onValueChange={setIsNotificationEnabled}
                trackColor={{ false: theme.border, true: COLORS.primary + '80' }}
                thumbColor={isNotificationEnabled ? COLORS.primary : '#FFFFFF'}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="volume-high-outline" size={22} color={COLORS.primary} />
                <Text style={[styles.rowLabel, { color: theme.text }]}>효과음 사용</Text>
              </View>
              <Switch
                value={isSoundEnabled}
                onValueChange={setIsSoundEnabled}
                trackColor={{ false: theme.border, true: COLORS.primary + '80' }}
                thumbColor={isSoundEnabled ? COLORS.primary : '#FFFFFF'}
              />
            </View>
          </View>
        </View>

        {/* ℹ️ 2. 앱 정보 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.subText }]}>앱 정보</Text>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="information-circle-outline" size={22} color={theme.subText} />
                <Text style={[styles.rowLabel, { color: theme.text }]}>앱 버전</Text>
              </View>
              <Text style={{ fontSize: 14, color: theme.subText, fontWeight: '600' }}>v1.0.0</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => Alert.alert('약관', '서비스 이용약관 내용은 준비 중입니다.')}
            >
              <View style={styles.rowLeft}>
                <Ionicons name="document-text-outline" size={22} color={theme.subText} />
                <Text style={[styles.rowLabel, { color: theme.text }]}>서비스 이용약관</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.subText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 🚪 3. 계정 설정 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.subText }]}>계정</Text>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={handleLogout}>
              <View style={styles.rowLeft}>
                <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
                <Text style={[styles.rowLabel, { color: COLORS.danger, fontWeight: '700' }]}>
                  로그아웃
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    width: '100%',
  },
});