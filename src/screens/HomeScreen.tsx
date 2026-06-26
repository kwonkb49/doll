import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Animated, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function HomeScreen({ route }: any) {
  const { isDarkMode } = useTheme();

  const theme = {
    bg: isDarkMode ? '#101012' : '#F8FAFC',
    card: isDarkMode ? '#1C1C1E' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#0F172A',
    subText: isDarkMode ? '#8E8E93' : '#64748B',
    border: isDarkMode ? '#2C2C2E' : '#E2E8F0',
  };

  const userRole = route?.params?.role || 'parent';
  const accentColor = userRole === 'parent' ? '#3182F6' : '#10B981';

  // ⚡ [수정] 이모지(emoji) 속성을 싹 지우고 필요한 데이터만 남겨 깔끔하게 정리했습니다!
  const [sensorData, setSensorData] = useState<any>({
    head: { raw: 0, percent: 0, peak: 80, label: '머리', active: false },
    belly: { raw: 0, percent: 0, peak: 69, label: '배', active: false },
    leftHand: { raw: 0, percent: 0, peak: 63, label: '왼손', active: false },
    rightHand: { raw: 0, percent: 0, peak: 64, label: '오른손', active: false },
    leftFoot: { raw: 0, percent: 0, peak: 76, label: '왼발', active: false },
    rightFoot: { raw: 0, percent: 0, peak: 77, label: '오른발', active: false },
  });

  const [totalMax, setTotalMax] = useState(0);
  const [touchCount, setTouchCount] = useState(6);
  const [touchLogs, setTouchLogs] = useState<any[]>([
    { id: '1', time: '오전 12:02', zone: '머리', status: '보통 터치', percent: 45 },
    { id: '2', time: '오전 12:00', zone: '오른손', status: '약한 터치', percent: 21 },
  ]);

  // 🔔 푸시 알림 애니메이션 및 텍스트 상태 관리
  const [alertText, setAlertText] = useState('');
  const alertAnim = useRef(new Animated.Value(-120)).current;

  const triggerPushNotification = (message: string) => {
    setAlertText(message);
    Animated.timing(alertAnim, {
      toValue: 10,
      duration: 400,
      useNativeDriver: false,
    }).start();

    setTimeout(() => {
      Animated.timing(alertAnim, {
        toValue: -120,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }, 3500);
  };

  const handleSensorPress = (zoneKey: string) => {
    const randomRaw = Math.floor(Math.random() * 4096);
    const calculatedPercent = Math.round((randomRaw / 4095) * 100);
    
    let currentLabel = '';
    setSensorData((prev: any) => {
      const currentZone = prev[zoneKey];
      currentLabel = currentZone.label;
      const newPeak = calculatedPercent > currentZone.peak ? calculatedPercent : currentZone.peak;

      return {
        ...prev,
        [zoneKey]: { ...currentZone, raw: randomRaw, percent: calculatedPercent, peak: newPeak, active: randomRaw > 0 }
      };
    });

    setTotalMax(calculatedPercent);
    setTouchCount(prev => prev + 1);

    const now = new Date();
    const timeStr = `${now.getHours() >= 12 ? '오후' : '오전'} ${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    let status = '약한 터치';
    if (calculatedPercent > 75) {
      status = '🚨 강한 충격';
      triggerPushNotification(`[위험 경고] ${currentLabel} 부위에 강한 충격(${calculatedPercent}%)이 실시간 감지되었습니다! 아동 상태 확인 요망.`);
    } else if (calculatedPercent > 40) {
      status = '보통 터치';
    }

    setTouchLogs(prev => [
      { id: String(Date.now()), time: timeStr, zone: currentLabel, status: status, percent: calculatedPercent },
      ...prev.slice(0, 4)
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      
      {/* 스마트 오버레이 가짜 푸시 알림 배너 */}
      <Animated.View style={[styles.pushBanner, { top: alertAnim }]}>
        <View style={styles.pushHeader}>
          <View style={styles.pushRow}>
            <Ionicons name="alert-circle" size={16} color="#FF3B30" style={{ marginRight: 6 }} />
            <Text style={styles.pushAppTitle}>케어돌 AI 관제</Text>
          </View>
          <Text style={styles.pushTimeText}>지금</Text>
        </View>
        <Text style={styles.pushBodyText} numberOfLines={2}>{alertText}</Text>
      </Animated.View>

      {/* 상단 헤더바 */}
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>인형 친구</Text>
          <Text style={[styles.headerSubTitle, { color: theme.subText }]}>감각 센서 모니터링</Text>
        </View>
        <View style={styles.headerRightRow}>
          <View style={styles.demoBadge}>
            <Text style={styles.demoBadgeText}>시뮬레이션 모드</Text>
          </View>
          <Text style={[styles.touchCountText, { color: accentColor }]}>총 {touchCount}회 터치</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* 1. 전체 실시간 터치 강도 진행 바 */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.rowBetween}>
            <Text style={[styles.cardSectionTitle, { color: theme.text }]}>직전 터치 강도</Text>
            <Text style={[styles.cardSectionTitle, { color: accentColor }]}>{totalMax}%</Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: isDarkMode ? '#2C2C2E' : '#E2E8F0' }]}>
            <View style={[styles.progressBarFill, { width: `${totalMax}%`, backgroundColor: accentColor }]} />
          </View>
        </View>

        {/* 2. 6분할 센서 대시보드 */}
        <Text style={[styles.sectionTitle, { color: theme.subText }]}>센서 부위별 강도 (75% 이상 시 알림 발동)</Text>
        <View style={styles.grid}>
          {Object.entries(sensorData).map(([key, sensor]: any) => (
            <TouchableOpacity 
              key={key} 
              activeOpacity={0.7}
              onPress={() => handleSensorPress(key)}
              style={[styles.sensorGridCard, { backgroundColor: theme.card, borderColor: sensor.percent > 75 ? '#FF3B30' : (sensor.active ? accentColor : theme.border), borderWidth: sensor.active ? 1.5 : 1 }]}
            >
              <View style={styles.rowBetween}>
                {/* ⚡ [수정] 이모지 렌더링 코드를 제거하고 텍스트만 깔끔하게 출력합니다! */}
                <Text style={[styles.sensorLabel, { color: theme.text }]}>{sensor.label}</Text>
                <Text style={[styles.sensorStatusText, { color: sensor.percent > 75 ? '#FF3B30' : (sensor.active ? accentColor : theme.subText), fontWeight: sensor.active ? '700' : '500' }]}>
                  {sensor.percent > 75 ? '위험 감지' : (sensor.active ? '감지 중' : '감지 없음')}
                </Text>
              </View>
              <View style={styles.sensorValueRow}>
                <Text style={[styles.bigPercent, { color: sensor.percent > 75 ? '#FF3B30' : theme.text }]}>{sensor.percent} <Text style={styles.smallPercentSign}>%</Text></Text>
                <View style={styles.rawValues}>
                  <Text style={[styles.rawText, { color: theme.subText }]}>{String(sensor.raw).padStart(4, '0')} / 4095</Text>
                  <Text style={[styles.peakText, { color: accentColor }]}>PEAK {sensor.peak}%</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 3. 실시간 터치 타임라인 로그 */}
        <Text style={[styles.sectionTitle, { color: theme.subText }]}>실시간 감각 신호 로그</Text>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          {touchLogs.map((log, index) => (
            <View key={log.id}>
              <View style={styles.logItemRow}>
                <View style={styles.logLeft}>
                  <Text style={[styles.logTime, { color: theme.subText }]}>{log.time}</Text>
                  <Text style={[styles.logZone, { color: theme.text }]}>[{log.zone}] 센서 반응</Text>
                </View>
                <View style={styles.logRight}>
                  <Text style={[styles.logStatus, { color: log.percent > 75 ? '#FF3B30' : theme.text }]}>{log.status}</Text>
                  <Text style={[styles.logPercent, { color: accentColor }]}>{log.percent}% 강도</Text>
                </View>
              </View>
              {index !== touchLogs.length - 1 && <View style={[styles.logDivider, { backgroundColor: theme.border }]} />}
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  pushBanner: { position: 'absolute', left: 16, right: 16, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 14, padding: 14, zIndex: 9999, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 10, borderWidth: 1, borderColor: '#F2F4F6' },
  pushHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  pushRow: { flexDirection: 'row', alignItems: 'center' },
  pushAppTitle: { fontSize: 12, fontWeight: '700', color: '#191F28', letterSpacing: -0.2 },
  pushTimeText: { fontSize: 11, color: '#8B95A1' },
  pushBodyText: { fontSize: 13, color: '#333D4B', fontWeight: '600', lineHeight: 18, letterSpacing: -0.3 },

  header: { height: 75, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  headerSubTitle: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  headerRightRow: { flexDirection: 'row', alignItems: 'center' },
  demoBadge: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 10 },
  demoBadgeText: { color: '#2563EB', fontSize: 11, fontWeight: '700' },
  touchCountText: { fontSize: 13, fontWeight: '600' },
  scrollContent: { padding: 24, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 20, marginBottom: 20 },
  cardSectionTitle: { fontSize: 14, fontWeight: '600' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressBarBg: { height: 8, borderRadius: 4, marginTop: 12, width: '100%', overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12, paddingLeft: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 12 },
  sensorGridCard: { width: '48.5%', borderRadius: 16, padding: 16, marginBottom: 12 },
  sensorLabel: { fontSize: 14, fontWeight: '600' },
  sensorStatusText: { fontSize: 11 },
  sensorValueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14 },
  bigPercent: { fontSize: 28, fontWeight: '700', lineHeight: 32 },
  smallPercentSign: { fontSize: 14, fontWeight: '500' },
  rawValues: { alignItems: 'flex-end' },
  rawText: { fontSize: 10, fontWeight: '600', fontFamily: 'Courier' },
  peakText: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  logItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  logLeft: { flexDirection: 'column' },
  logTime: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
  logZone: { fontSize: 14, fontWeight: '600' },
  logRight: { alignItems: 'flex-end' },
  logStatus: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  logPercent: { fontSize: 12, fontWeight: '700' },
  logDivider: { height: 1, marginVertical: 6 }
});