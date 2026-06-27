import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { useTheme } from '../context/ThemeContext';
import { Period, useEmotionStats } from '../hooks/useEmotionStats';
import { COLORS, getTheme } from '../screens/theme';

const DEVICE_ID = '961804ad-1abc-43cd-af82-936272481ec5';

export default function ReportScreen() {
  const { isDarkMode } = useTheme();
  const theme = getTheme(isDarkMode);
  
  // 📆 사라졌던 주, 월, 일 필터 상태 복구!
  const [period, setPeriod] = useState<Period>('오늘');
  const { stats, loading, total } = useEmotionStats(DEVICE_ID, period);

  const emptyColor = isDarkMode ? COLORS.dark.border : COLORS.border;

  const pieData = stats && stats.length > 0
    ? stats.map((s) => ({ value: s.count || 0, color: s.percentage > 30 ? COLORS.primary : COLORS.secondary }))
    : [{ value: 1, color: emptyColor }];

  const barData = stats && stats.length > 0
    ? stats.map((s) => ({ value: s.count || 0, label: s.emotion || '-', frontColor: COLORS.primary }))
    : [{ value: 0, label: '-', frontColor: emptyColor }];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>감정 분석 리포트</Text>

        {/* 📆 전처럼 기간 선택 필터 탭 바 제공 */}
        <View style={[styles.tabWrap, { backgroundColor: isDarkMode ? COLORS.dark.border : COLORS.border }]}>
          {(['오늘', '이번 주', '이번 달'] as Period[]).map((p) => (
            <Pressable key={p} style={[styles.tab, period === p && { backgroundColor: theme.card }]} onPress={() => setPeriod(p)}>
              <Text style={[styles.tabText, { color: theme.subText }, period === p && { color: COLORS.primary, fontWeight: '700' }]}>
                {p}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardSub, { color: theme.subText }]}>통계 타임라인 파일</Text>
          <Text style={[styles.totalCount, { color: theme.text }]}>
            총 <Text style={{ color: COLORS.primary }}>{total || 0}회</Text> 신호 감지됨
          </Text>
          {loading && <Text style={{ color: theme.subText, fontSize: 12, marginTop: 4 }}>원격 실시간 연동 중...</Text>}
        </View>

        {/* 원형 분포 차트 복구 */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, alignItems: 'center' }]}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, alignSelf: 'flex-start', marginBottom: 16 }}>감정 분포 비율</Text>
          <PieChart data={pieData} donut radius={85} innerRadius={60} centerLabelComponent={() => (
            <Text style={{ fontSize: 20, fontWeight: '800', color: theme.text }}>{total || 0}회</Text>
          )} />
        </View>

        {/* 📊 막대 주/월 빈도 차트 완전 복구 */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, alignItems: 'center' }]}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, alignSelf: 'flex-start', marginBottom: 16 }}>감정 빈도 분석 그래프</Text>
          <BarChart data={barData} barWidth={28} spacing={20} noOfSections={3} barBorderRadius={6} xAxisColor={theme.border} hideRules />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  tabWrap: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabText: { fontSize: 14, fontWeight: '500' },
  card: { borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1 },
  cardSub: { fontSize: 13, marginBottom: 4 },
  totalCount: { fontSize: 18, fontWeight: '700' }
});