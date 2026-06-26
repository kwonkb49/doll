import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, SafeAreaView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function SettingScreen({ route, navigation }: any) {
  const { isDarkMode, toggleTheme } = useTheme();

  const theme = {
    bg: isDarkMode ? '#101012' : '#F8FAFC',
    card: isDarkMode ? '#1C1C1E' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#0F172A',
    subText: isDarkMode ? '#8E8E93' : '#64748B',
    border: isDarkMode ? '#2C2C2E' : '#E2E8F0',
  };

  const userRole = route?.params?.role || 'parent';
  const accentColor = userRole === 'parent' ? '#3182F6' : '#10B981';

  // 🔐 비밀번호 변경 버튼 클릭 시 실행될 함수
  const handleChangePassword = () => {
    Alert.alert(
      "비밀번호 변경",
      "보안을 위해 가입하신 이메일로 인증 링크를 발송하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        { text: "발송", onPress: () => Alert.alert("완료", "인증 이메일이 발송되었습니다.") }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      {/* 상단 헤더 */}
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>설정</Text>
      </View>

      <View style={styles.content}>
        {/* 화면 설정 섹션 */}
        <Text style={[styles.sectionTitle, { color: theme.subText }]}>화면 설정</Text>
        <View style={[styles.settingCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <Ionicons name={isDarkMode ? "moon" : "sunny"} size={22} color={accentColor} style={{ marginRight: 12 }} />
              <Text style={[styles.settingText, { color: theme.text }]}>다크모드 적용</Text>
            </View>
            <Switch
              trackColor={{ false: '#E9E9EB', true: accentColor }}
              thumbColor={'#FFFFFF'}
              ios_backgroundColor="#E9E9EB"
              onValueChange={toggleTheme}
              value={isDarkMode}
            />
          </View>
        </View>

        {/* 🔒 보안 및 계정 관리 섹션 (신규 추가!) */}
        <Text style={[styles.sectionTitle, { color: theme.subText }]}>보안 및 계정 관리</Text>
        <View style={[styles.settingCard, { backgroundColor: theme.card, borderColor: theme.border, paddingVertical: 4 }]}>
          <TouchableOpacity 
            activeOpacity={0.6} 
            style={styles.clickableRow}
            onPress={handleChangePassword}
          >
            <View style={styles.row}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.text} style={{ marginRight: 12 }} />
              <Text style={[styles.settingText, { color: theme.text }]}>비밀번호 변경</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.subText} />
          </TouchableOpacity>
        </View>

        {/* 계정 정보 섹션 */}
        <Text style={[styles.sectionTitle, { color: theme.subText }]}>시스템 정보</Text>
        <View style={[styles.settingCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.subText }]}>접속 유형</Text>
            <Text style={[styles.infoValue, { color: accentColor, fontWeight: '700' }]}>
              {userRole === 'parent' ? ' 보호자 ' : ' 보호사 '}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.subText }]}>앱 버전</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>v1.0.0 (최신 버전)</Text>
          </View>
        </View>

        {/* 🚪 로그아웃 버튼 (텍스트 변경 완료!) */}
        <TouchableOpacity 
          activeOpacity={0.8}
          style={[styles.logoutBtn, { backgroundColor: isDarkMode ? '#2C2C2E' : '#E2E8F0' }]}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'RoleSelect' }] })}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { height: 60, justifyContent: 'center', paddingHorizontal: 24, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  content: { padding: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 10, paddingLeft: 4 },
  settingCard: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 16, marginBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clickableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  settingText: { fontSize: 16, fontWeight: '600' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  infoLabel: { fontSize: 15, fontWeight: '500' },
  infoValue: { fontSize: 15, fontWeight: '600' },
  divider: { height: 1, marginVertical: 12 },
  logoutBtn: { width: '100%', padding: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  logoutBtnText: { color: '#FF3B30', fontSize: 15, fontWeight: '700' }
});