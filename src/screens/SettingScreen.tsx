import { Ionicons } from '@expo/vector-icons';
import React from 'react';
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
import { COLORS, getAccent, getAccentLight, getTheme } from '../screens/theme';

export default function SettingScreen({ route, navigation }: any) {
  const { isDarkMode, toggleTheme } = useTheme();
  const theme = getTheme(isDarkMode);
  const userRole = route?.params?.role || 'parent';
  const accent = getAccent(userRole);
  const accentLight = getAccentLight(userRole);

  // 🔒 [기능 복구] 원래 있던 비밀번호 변경 얼럿 알림 시스템 원복!
  const handleChangePassword = () => {
    Alert.alert(
      '비밀번호 변경',
      '보안을 위해 가입하신 이메일로 인증 링크를 발송하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '발송', onPress: () => Alert.alert('완료', '인증 이메일이 발송되었습니다.') },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      {/* 상단 헤더 */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>설정</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* 💳 프로필 상단 배너 카드 복구 */}
        <View style={[styles.profileCard, { backgroundColor: accentLight }]}>
          <View style={[styles.profileIcon, { backgroundColor: accent }]}>
            <Ionicons
              name={userRole === 'parent' ? 'heart' : 'people'}
              size={22}
              color="#FFFFFF"
            />
          </View>
          <View>
            <Text style={[styles.profileRole, { color: accent }]}>
              {userRole === 'parent' ? '보호자 모드' : '보호사 · 선생님 모드'}
            </Text>
            <Text style={{ fontSize: 13, color: accent + 'BB', marginTop: 2 }}>마음이음 상시 연동 중</Text>
          </View>
        </View>

        {/* 화면 설정 섹션 */}
        <Text style={[styles.sectionLabel, { color: theme.subText }]}>화면 설정</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: isDarkMode ? '#2C2C2E' : COLORS.background }]}>
                <Ionicons name={isDarkMode ? 'moon' : 'sunny-outline'} size={18} color={accent} />
              </View>
              <Text style={[styles.itemText, { color: theme.text }]}>다크모드 적용</Text>
            </View>
            <Switch
              trackColor={{ false: COLORS.border, true: accent }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={COLORS.border}
              onValueChange={toggleTheme}
              value={isDarkMode}
            />
          </View>
        </View>

        {/* 🔒 보안 및 계정 관리 기능 섹션 완전 복구 */}
        <Text style={[styles.sectionLabel, { color: theme.subText }]}>보안 및 계정 관리</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity activeOpacity={0.6} style={styles.clickRow} onPress={handleChangePassword}>
            <View style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: isDarkMode ? '#2C2C2E' : COLORS.background }]}>
                <Ionicons name="lock-closed-outline" size={18} color={theme.text} />
              </View>
              <Text style={[styles.itemText, { color: theme.text }]}>비밀번호 변경</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.subText} />
          </TouchableOpacity>
        </View>

        {/* ℹ️ 시스템 정보 섹션 디바이스 규격 및 디바이더 레이아웃 복구 */}
        <Text style={[styles.sectionLabel, { color: theme.subText }]}>시스템 정보</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.subText }]}>접속 유형</Text>
            <View style={[styles.infoBadge, { backgroundColor: accentLight }]}>
              <Text style={[styles.infoBadgeText, { color: accent }]}>
                {userRole === 'parent' ? '보호자' : '보호사'}
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.subText }]}>앱 버전</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>v1.0.0 (최신 버전)</Text>
          </View>
        </View>

        {/* 🚪 로그아웃 시스템 초기화 트리거 버튼 */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.logoutBtn, { backgroundColor: isDarkMode ? COLORS.dark.surface : COLORS.background, borderColor: theme.border }]}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'RoleSelect' }] })}
        >
          <Ionicons name="log-out-outline" size={18} color={COLORS.danger} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { height: 60, justifyContent: 'center', paddingHorizontal: 24, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  content: { padding: 24, paddingBottom: 48 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, padding: 18, marginBottom: 28 },
  profileIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  profileRole: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  sectionLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 },
  card: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 4, marginBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  clickRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  iconWrap: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  itemText: { fontSize: 15, fontWeight: '500' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  infoLabel: { fontSize: 14, fontWeight: '500' },
  infoValue: { fontSize: 14, fontWeight: '600' },
  infoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  infoBadgeText: { fontSize: 12, fontWeight: '600' },
  divider: { height: 1, marginVertical: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, borderWidth: 1, marginTop: 4 },
  logoutText: { fontSize: 15, fontWeight: '600', color: COLORS.danger },
});