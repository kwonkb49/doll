import React, { useRef, useState } from 'react';
import { Animated, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { COLORS, getAccent, getTheme } from '../screens/theme';

export default function HomeScreen({ route }: any) {
  const { isDarkMode } = useTheme();
  const theme = getTheme(isDarkMode);
  const userRole = route?.params?.role || 'parent';
  const accent = getAccent(userRole);

  const [sensorData, setSensorData] = useState<any>({
    head:      { raw: 0, percent: 0, peak: 80, label: '머리',   active: false },
    belly:     { raw: 0, percent: 0, peak: 69, label: '배',     active: false },
    leftHand:  { raw: 0, percent: 0, peak: 63, label: '왼손',   active: false },
    rightHand: { raw: 0, percent: 0, peak: 64, label: '오른손', active: false },
    leftFoot:  { raw: 0, percent: 0, peak: 76, label: '왼발',   active: false },
    rightFoot: { raw: 0, percent: 0, peak: 77, label: '오른발', active: false },
  });

  const [totalMax, setTotalMax] = useState(0);
  const [touchCount, setTouchCount] = useState(6);
  const [touchLogs, setTouchLogs] = useState<any[]>([
    { id: '1', time: '오전 12:02', zone: '머리',   status: '보통 터치', percent: 45 },
    { id: '2', time: '오전 12:00', zone: '오른손', status: '약한 터치', percent: 21 },
  ]);

  const [alertText, setAlertText] = useState('');
  const alertAnim = useRef(new Animated.Value(-120)).current;

  // 🔔 원래 있던 인앱 푸시 알림 시스템 복구!
  const triggerPushNotification = (message: string) => {
    setAlertText(message);
    Animated.timing(alertAnim, { toValue: 20, duration: 400, useNativeDriver: false }).start();
    setTimeout(() => {
      Animated.timing(alertAnim, { toValue: -120, duration: 400, useNativeDriver: false }).start();
    }, 3500);
  };

  const handleSensorPress = (zoneKey: string) => {
    const randomRaw = Math.floor(Math.random() * 4096);
    const calculatedPercent = Math.round((randomRaw / 4095) * 100);
    let currentLabel = sensorData[zoneKey].label;

    setSensorData((prev: any) => {
      const currentZone = prev[zoneKey];
      const newPeak = calculatedPercent > currentZone.peak ? calculatedPercent : currentZone.peak;
      return {
        ...prev,
        [zoneKey]: { ...currentZone, raw: randomRaw, percent: calculatedPercent, peak: newPeak, active: randomRaw > 0 },
      };
    });

    setTotalMax(calculatedPercent);
    setTouchCount((prev) => prev + 1);

    const now = new Date();
    const timeStr = `${now.getHours() >= 12 ? '오후' : '오전'} ${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')}`;

    let status = '약한 터치';
    if (calculatedPercent > 75) {
      status = '🚨 강한 충격';
      triggerPushNotification(`[위험 경고] ${currentLabel} 부위에 강한 충격(${calculatedPercent}%) 감지! 확인 요망.`);
    } else if (calculatedPercent > 40) {
      status = '보통 터치';
    }

    setTouchLogs((prev) => [
      { id: String(Date.now()), time: timeStr, zone: currentLabel, status, percent: calculatedPercent },
      ...prev.slice(0, 5),
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      {/* 🔔 상단 푸시 알림 배너 UI 복구 */}
      <Animated.View style={[styles.pushBanner, { top: alertAnim, backgroundColor: theme.card, borderColor: COLORS.danger }]}>
        <View style={styles.pushHeader}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.danger }}>AI 상시 관제 경고</Text>
          <Text style={{ fontSize: 11, color: COLORS.textMuted }}>방금</Text>
        </View>
        <Text style={{ fontSize: 13, color: theme.text, fontWeight: '600', marginTop: 2 }}>{alertText}</Text>
      </Animated.View>

      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.touchCount, { color: accent }]}>총 {touchCount}회 교감</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.rowBetween}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>전체 교감 신호 강도</Text>
            <Text style={[styles.cardTitle, { color: totalMax > 75 ? COLORS.danger : accent }]}>{totalMax}%</Text>
          </View>
          <View style={[styles.progressBg, { backgroundColor: isDarkMode ? COLORS.dark.border : COLORS.border }]}>
            <View style={[styles.progressFill, { width: `${totalMax}%`, backgroundColor: totalMax > 75 ? COLORS.danger : accent }]} />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.subText }]}>하드웨어 디바이스 노드 (원격 터치 테스트)</Text>
        <View style={styles.grid}>
          {Object.entries(sensorData).map(([key, sensor]: any) => {
            const isDanger = sensor.percent > 75;
            return (
              <TouchableOpacity
                key={key}
                activeOpacity={0.75}
                onPress={() => handleSensorPress(key)}
                style={[styles.sensorCard, { backgroundColor: theme.card, borderColor: isDanger ? COLORS.danger : sensor.active ? accent : theme.border, borderWidth: 1 }]}
              >
                <View style={styles.rowBetween}>
                  <Text style={[styles.sensorLabelStyle, { color: theme.text }]}>{sensor.label}</Text>
                  <Text style={{ fontSize: 10, color: isDanger ? COLORS.danger : sensor.active ? accent : theme.subText, fontWeight: '600' }}>
                    {isDanger ? '임계초과' : sensor.active ? '동작중' : '대기'}
                  </Text>
                </View>
                <Text style={[styles.sensorPercent, { color: theme.text }]}>{sensor.percent}%</Text>
                <View style={styles.rowBetween}>
                  <Text style={{ fontSize: 10, color: theme.subText, fontFamily: 'monospace' }}>RAW {String(sensor.raw).padStart(4, '0')}</Text>
                  <Text style={{ fontSize: 10, color: accent, fontWeight: '700' }}>PEAK {sensor.peak}%</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 📑 원래 있던 트랜잭션 로그 목록 복구 */}
        <Text style={[styles.sectionLabel, { color: theme.subText, marginTop: 12 }]}>트랜잭션 로그 분석 데이터</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, paddingVertical: 10 }]}>
          {touchLogs.map((log, index) => (
            <View key={log.id}>
              <View style={styles.logRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.logZone, { color: theme.text }]}>[{log.zone}] 모듈 - {log.status}</Text>
                  <Text style={{ fontSize: 11, color: theme.subText, marginTop: 2 }}>{log.time}</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: log.percent > 75 ? COLORS.danger : accent }}>{log.percent}% 강도</Text>
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
  pushBanner: { position: 'absolute', left: 16, right: 16, borderRadius: 16, padding: 14, zIndex: 9999, borderWidth: 1, shadowOpacity: 0.1, elevation: 6 },
  pushHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  header: { height: 72, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 2 },
  touchCount: { fontSize: 13, fontWeight: '600' },
  scroll: { padding: 20 },
  card: { borderRadius: 16, padding: 18, marginBottom: 20, borderWidth: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressBg: { height: 6, borderRadius: 3, marginTop: 12, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  sectionLabel: { fontSize: 12, fontWeight: '600', marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sensorCard: { width: '48%', borderRadius: 14, padding: 14, gap: 6 },
  sensorLabelStyle: { fontSize: 13, fontWeight: '600' },
  sensorPercent: { fontSize: 24, fontWeight: '700', marginVertical: 2 },
  logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4 },
  logZone: { fontSize: 13, fontWeight: '600' },
  logDivider: { height: 1 }
});