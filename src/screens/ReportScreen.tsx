import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { useTheme } from '../context/ThemeContext';
import { Period, useEmotionStats } from '../hooks/useEmotionStats';

const DEVICE_ID = '961804ad-1abc-43cd-af82-936272481ec5';

export default function ReportScreen() {
  const { isDarkMode } = useTheme();
  const [period, setPeriod] = useState<Period>('오늘');
  const { stats, loading, total } = useEmotionStats(DEVICE_ID, period);

  // 📊 딥 다크모드 색상표 반영
  const theme = {
    bg: isDarkMode ? '#101012' : '#F2F4F6',          
    card: isDarkMode ? '#1C1C1E' : '#FFFFFF',        
    text: isDarkMode ? '#FFFFFF' : '#191F28',        
    subText: isDarkMode ? '#8E8E93' : '#6B7280',     
    border: isDarkMode ? '#2C2C2E' : '#E5E8EB',      
    tabBg: isDarkMode ? '#2C2C2E' : '#E5E8EB',       
    tabActive: isDarkMode ? '#101012' : '#FFFFFF',   
  };

  const emptyColor = isDarkMode ? '#2C2C2E' : '#E5E8EB';
  const pieData = stats.length > 0 
    ? stats.map(s => ({ value: s.count, color: s.percentage > 30 ? '#3182F6' : '#A7D7C5' })) 
    : [{ value: 1, color: emptyColor }];
    
  const barData = stats.length > 0 
    ? stats.map(s => ({ value: s.count, label: s.emotion })) 
    : [{ value: 0, label: '-' }];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>감정 분석 리포트</Text>

        {/* 탭 세팅 */}
        <View style={[styles.tabContainer, { backgroundColor: theme.tabBg }]}>
          {(['오늘', '이번 주', '이번 달'] as Period[]).map((p) => (
            <Pressable
              key={p}
              style={[
                styles.tabItem, 
                period === p && [styles.tabActive, { backgroundColor: theme.tabActive }]
              ]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[
                styles.tabText, 
                { color: theme.subText },
                period === p && styles.tabTextActive
              ]}>
                {p}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* 총 횟수 안내 카드 */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardSub, { color: theme.subText }]}>선택한 기간 동안</Text>
          <Text style={[styles.cardMainTitle, { color: theme.text }]}>
            총 <Text style={styles.blueText}>{total}회</Text> 감지되었어요
          </Text>
        </View>

        {/* 차트 1: 도넛 차트 */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>전체 감정 비율</Text>
          <View style={styles.chartCenter}>
            <PieChart
              data={pieData}
              donut
              radius={85}
              innerRadius={60}
              centerLabelComponent={() => (
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.text }}>{total}회</Text>
                  <Text style={{ fontSize: 12, color: theme.subText, marginTop: 2 }}>누적 빈도</Text>
                </View>
              )}
            />
          </View>
        </View>

        {/* 차트 2: 막대 차트 */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>감정별 빈도 분석</Text>
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <BarChart
              data={barData}
              barWidth={32}
              spacing={25}
              noOfSections={3}
              barBorderRadius={6}
              frontColor="#3182F6"
              yAxisThickness={0}
              xAxisThickness={1}
              xAxisColor={theme.border}
              yAxisTextStyle={{ color: theme.subText }}
              xAxisLabelTextStyle={{ color: theme.subText }}
              hideRules
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  tabContainer: { flexDirection: 'row', borderRadius: 14, padding: 4, marginBottom: 24 },
  tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  tabActive: { elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  tabText: { fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: '#3182F6', fontWeight: 'bold' },
  card: { padding: 24, borderRadius: 24, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 },
  cardSub: { fontSize: 14, fontWeight: '500' },
  cardMainTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  blueText: { color: '#3182F6' },
  chartTitle: { fontSize: 16, fontWeight: 'bold' },
  chartCenter: { alignItems: 'center', marginVertical: 20 },
});