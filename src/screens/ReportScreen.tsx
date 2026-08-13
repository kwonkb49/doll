import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { useTheme } from '../context/ThemeContext';
import { COLORS, getTheme } from '../screens/theme';

const BASE_URL = 'https://doll-1v83.onrender.com';

const getStoredToken = async () => {
  try {
    let token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      token = await AsyncStorage.getItem('token');
    }
    return token;
  } catch (e) {
    return null;
  }
};

interface Child {
  id: number | string;
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
}

interface InteractionItem {
  id: number;
  rawText?: string;
  touchIntensity?: number;
  detectedEmotion?: string;
  aiReply?: string;
  createdAt: string;
  context?: string;
}

interface EmotionRankItem {
  emotion: string;
  count: number;
  percentage: number;
}

interface TriggerItem {
  context: string;
  count: number;
  avgIntensity: number;
}

// 💡 [핵심 수정] UTC 시차 오차 없이 현지(KST) YYYY-MM-DD 문자열로 변환하는 함수
const getLocalDateStr = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch (e) {
    return '';
  }
};

export default function ReportScreen() {
  const { isDarkMode } = useTheme();
  const theme = getTheme(isDarkMode);

  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [isSelectModalVisible, setIsSelectModalVisible] = useState(false);

  const todayObj = new Date();
  const [currentYear, setCurrentYear] = useState(todayObj.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(todayObj.getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getLocalDateStr(todayObj));

  // 모달 상태
  const [isMonthReportVisible, setIsMonthReportVisible] = useState(false);
  const [isWeekReportVisible, setIsWeekReportVisible] = useState(false);
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(0);

  // 데이터 상태
  const [allInteractions, setAllInteractions] = useState<InteractionItem[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<any>(null);
  const [monthlyStats, setMonthlyStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchChildren = async () => {
    try {
      const token = await getStoredToken();
      if (!token) return;

      const res = await axios.get(`${BASE_URL}/children`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (Array.isArray(res.data)) {
        setChildrenList(res.data);
        if (res.data.length > 0) {
          setSelectedChild((prev) => {
            if (!prev) return res.data[0];
            const matched = res.data.find((c: Child) => String(c.id) === String(prev.id));
            return matched || res.data[0];
          });
        }
      }
    } catch (err) {
      setChildrenList([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchChildren();
    }, [])
  );

  const fetchAllInteractions = async () => {
    if (!selectedChild) return;

    setLoading(true);
    const childId = Number(selectedChild.id);

    try {
      const token = await getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // 1. 일별/전체 내역 안전 조회
      try {
        const res = await axios.get(`${BASE_URL}/children/${childId}/interactions`, { headers });
        let rawData = res.data;
        if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
          rawData = rawData.interactions || rawData.data || rawData.list || [];
        }
        setAllInteractions(Array.isArray(rawData) ? rawData : []);
      } catch (e) {
        setAllInteractions([]);
      }

      // 2. 주간 통계 조회
      try {
        const weeklyRes = await axios.get(`${BASE_URL}/children/${childId}/statistics/weekly`, { headers });
        setWeeklyStats(weeklyRes.data);
      } catch (e) {
        setWeeklyStats(null);
      }

      // 3. 월간 통계 조회
      try {
        const monthlyRes = await axios.get(
          `${BASE_URL}/children/${childId}/statistics/monthly?year=${currentYear}&month=${currentMonth + 1}`,
          { headers }
        );
        setMonthlyStats(monthlyRes.data);
      } catch (e) {
        setMonthlyStats(null);
      }
    } catch (err) {
      setAllInteractions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllInteractions();
  }, [selectedChild?.id, currentYear, currentMonth]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const totalWeeks = Math.ceil((daysInMonth + firstDayOfWeek) / 7);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    setSelectedDateStr(`${currentYear}-${formattedMonth}-${formattedDay}`);
  };

  const handleOpenWeekReport = (weekIdx: number) => {
    setSelectedWeekNum(weekIdx);
    setIsWeekReportVisible(true);
  };

  // 📋 일별 필터링
  const dailyInteractions = allInteractions.filter((item) => {
    if (!item || !item.createdAt) return false;
    return getLocalDateStr(item.createdAt) === selectedDateStr;
  });

  // 📊 월별 필터링
  const monthInteractions = allInteractions.filter((item) => {
    if (!item || !item.createdAt) return false;
    const d = new Date(item.createdAt);
    if (isNaN(d.getTime())) return false;
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  // 📊 선택된 주차 필터링
  const selectedWeekInteractions = monthInteractions.filter((item) => {
    if (!item || !item.createdAt) return false;
    const d = new Date(item.createdAt);
    if (isNaN(d.getTime())) return false;
    if (d.getFullYear() !== currentYear || d.getMonth() !== currentMonth) return false;
    const dayNum = d.getDate();
    const weekIdx = Math.floor((dayNum + firstDayOfWeek - 1) / 7);
    return weekIdx === selectedWeekNum;
  });

  // 주간 차트 가공
  const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0];
  selectedWeekInteractions.forEach((item) => {
    const d = new Date(item.createdAt);
    if (!isNaN(d.getTime())) {
      dayOfWeekCounts[d.getDay()] += 1;
    }
  });

  const weekBarData = ['일', '월', '화', '수', '목', '금', '토'].map((label, idx) => ({
    value: dayOfWeekCounts[idx],
    label,
    frontColor: idx === 0 ? COLORS.danger : idx === 6 ? COLORS.primary : COLORS.primary + 'AA',
    topLabelComponent: () => (
      <Text style={{ color: theme.text, fontSize: 10, fontWeight: '700', marginBottom: 2 }}>
        {dayOfWeekCounts[idx]}
      </Text>
    ),
  }));

  const weekEmotionMap: Record<string, number> = {};
  selectedWeekInteractions.forEach((item) => {
    const emotion = item.detectedEmotion || '평온';
    weekEmotionMap[emotion] = (weekEmotionMap[emotion] || 0) + 1;
  });

  const colorPalette = [COLORS.primary, '#4CAF50', '#FF9800', '#E91E63', COLORS.secondary];
  const emptyColor = isDarkMode ? COLORS.dark.border : COLORS.border;

  const weekPieData =
    Object.keys(weekEmotionMap).length > 0
      ? Object.keys(weekEmotionMap).map((key, idx) => ({
          value: weekEmotionMap[key],
          color: colorPalette[idx % colorPalette.length],
        }))
      : [{ value: 1, color: emptyColor }];

  // 월간 종합 리포트 요약 (백엔드 통계 데이터 우선, 없으면 자동 계산)
  const mSummary = monthlyStats?.summary || {
    totalInteractions: monthInteractions.length,
    avgTouchIntensity:
      monthInteractions.length > 0
        ? Math.round(
            monthInteractions.reduce((acc, cur) => acc + (cur.touchIntensity || 0), 0) /
              monthInteractions.length
          )
        : 0,
    dominantEmotion: '평온',
    intensityDiffPercent: 0,
    aiInsightComment: '선택하신 기간 내 교감 기록을 바탕으로 감정 패턴을 분석 중입니다.',
  };

  // 월간 감정 순위 가공
  const monthlyEmotionRank: EmotionRankItem[] =
    monthlyStats?.emotionDistribution ||
    Object.keys(
      monthInteractions.reduce((acc, cur) => {
        const emo = cur.detectedEmotion || '평온';
        acc[emo] = (acc[emo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map((emotion) => {
      const count = monthInteractions.filter((i) => (i.detectedEmotion || '평온') === emotion).length;
      return {
        emotion,
        count,
        percentage: Math.round((count / (monthInteractions.length || 1)) * 100),
      };
    });

  const monthPieData =
    monthlyEmotionRank.length > 0
      ? monthlyEmotionRank.map((item, idx) => ({
          value: item.count,
          color: colorPalette[idx % colorPalette.length],
        }))
      : [{ value: 1, color: emptyColor }];

  const monthBarData =
    monthlyEmotionRank.length > 0
      ? monthlyEmotionRank.map((item, idx) => ({
          value: item.count,
          label: item.emotion,
          frontColor: colorPalette[idx % colorPalette.length],
          topLabelComponent: () => (
            <Text style={{ color: theme.text, fontSize: 10, fontWeight: '700', marginBottom: 2 }}>
              {item.count}회
            </Text>
          ),
        }))
      : [{ value: 0, label: '-', frontColor: emptyColor }];

  const topTriggers: TriggerItem[] = monthlyStats?.topTriggers || [];
  const clinicalInsights = monthlyStats?.clinicalInsights || { aiSuccessRate: 85 };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* 상단 타이틀 & 아이 선택 */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>감정 분석 리포트</Text>
            {selectedChild && (
              <Text style={{ fontSize: 12, color: theme.subText, marginTop: -14, marginBottom: 14 }}>
                {selectedChild.gender === 'MALE' ? '남아' : '여아'} · {selectedChild.age}세
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.childSelectBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => setIsSelectModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.childSelectText, { color: COLORS.primary }]}>
              {selectedChild ? selectedChild.name : '아이 선택'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* 상단 요약 카드 */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardSub, { color: theme.subText }]}>교감 분석 기록</Text>
          <Text style={[styles.totalCount, { color: theme.text }]}>
            {selectedDateStr} 기준 <Text style={{ color: COLORS.primary }}>{dailyInteractions.length}회</Text> 감지
          </Text>
          {loading && (
            <Text style={{ color: theme.subText, fontSize: 12, marginTop: 4 }}>
              실시간 DB 기록을 불러오는 중입니다...
            </Text>
          )}
        </View>

        {/* 달력 카드 */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={handlePrevMonth} hitSlop={10}>
              <Ionicons name="chevron-back" size={20} color={theme.text} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsMonthReportVisible(true)}
              activeOpacity={0.7}
              style={styles.monthTitleBtn}
            >
              <Text style={[styles.calendarMonthText, { color: COLORS.primary }]}>
                {currentYear}년 {currentMonth + 1}월 종합 리포트
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNextMonth} hitSlop={10}>
              <Ionicons name="chevron-forward" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            <Text style={[styles.weekHeaderTag, { color: theme.subText }]}>주차</Text>
            {['일', '월', '화', '수', '목', '금', '토'].map((week, idx) => (
              <Text
                key={week}
                style={[
                  styles.weekText,
                  { color: idx === 0 ? COLORS.danger : idx === 6 ? COLORS.primary : theme.subText },
                ]}
              >
                {week}
              </Text>
            ))}
          </View>

          {Array.from({ length: totalWeeks }).map((_, weekIdx) => (
            <View key={`week-row-${weekIdx}`} style={styles.calendarWeekRow}>
              <TouchableOpacity
                style={styles.weekSelectBtn}
                onPress={() => handleOpenWeekReport(weekIdx)}
                activeOpacity={0.7}
              >
                <Text style={styles.weekSelectText}>{weekIdx + 1}주 리포트</Text>
              </TouchableOpacity>

              {Array.from({ length: 7 }).map((_, dayOfWeekIdx) => {
                const cellIndex = weekIdx * 7 + dayOfWeekIdx;
                const dayNum = cellIndex - firstDayOfWeek + 1;
                const isValidDay = dayNum > 0 && dayNum <= daysInMonth;

                if (!isValidDay) {
                  return <View key={`empty-${cellIndex}`} style={styles.dayCell} />;
                }

                const formattedMonth = String(currentMonth + 1).padStart(2, '0');
                const formattedDay = String(dayNum).padStart(2, '0');
                const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;

                const isSelected = dateStr === selectedDateStr;
                const isToday = dateStr === getLocalDateStr(todayObj);

                return (
                  <TouchableOpacity
                    key={`day-${dayNum}`}
                    style={[
                      styles.dayCell,
                      isSelected && { backgroundColor: COLORS.primary, borderRadius: 18 },
                    ]}
                    onPress={() => handleSelectDay(dayNum)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: theme.text },
                        isSelected && { color: '#FFFFFF', fontWeight: '800' },
                        isToday && !isSelected && { color: COLORS.primary, fontWeight: '700' },
                      ]}
                    >
                      {dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* 선택한 날짜 상세 목록 */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 14 }}>
            {selectedDateStr} 교감 상세 내역 목록
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
          ) : dailyInteractions.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Ionicons name="chatbubbles-outline" size={28} color={theme.subText} />
              <Text style={{ color: theme.subText, marginTop: 6, fontSize: 13 }}>
                선택한 날짜에 감지된 상호작용 기록이 없습니다.
              </Text>
            </View>
          ) : (
            dailyInteractions.map((item, idx) => {
              let timeDisplay = selectedDateStr;
              if (item.createdAt) {
                try {
                  const itemDate = new Date(item.createdAt);
                  timeDisplay = itemDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } catch (e) {}
              }

              return (
                <View
                  key={item.id || idx}
                  style={[
                    styles.interactionRow,
                    idx !== dailyInteractions.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.emotionBadge, { backgroundColor: COLORS.primary + '18', color: COLORS.primary }]}>
                        {item.detectedEmotion || '평온'}
                      </Text>
                      <Text style={{ fontSize: 11, color: theme.subText }}>{timeDisplay}</Text>
                    </View>
                    {item.rawText && (
                      <Text style={{ fontSize: 13, color: theme.text, marginTop: 4, fontWeight: '500' }}>
                        아이: "{item.rawText}"
                      </Text>
                    )}
                    {item.aiReply && (
                      <Text style={{ fontSize: 12, color: theme.subText, marginTop: 2 }}>
                        인형: "{item.aiReply}"
                      </Text>
                    )}
                  </View>

                  {item.touchIntensity !== undefined && item.touchIntensity !== null && (
                    <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.primary }}>
                      터치 {item.touchIntensity}%
                    </Text>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* 주간(Week) 리포트 모달 */}
      <Modal
        visible={isWeekReportVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsWeekReportVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.monthReportContainer, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {currentMonth + 1}월 {selectedWeekNum + 1}주차 주간 리포트
                </Text>
                <Text style={{ fontSize: 12, color: theme.subText, marginTop: 2 }}>
                  요일별 교감 패턴 및 주간 감정 분석
                </Text>
              </View>
              <Pressable onPress={() => setIsWeekReportVisible(false)} hitSlop={10}>
                <Ionicons name="close-circle" size={26} color={theme.subText} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={styles.metricsRow}>
                <View style={[styles.metricCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <View style={styles.metricIconHeader}>
                    <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                    <Text style={[styles.metricLabel, { color: theme.subText }]}>주간 총 교감</Text>
                  </View>
                  <Text style={[styles.metricValue, { color: theme.text }]}>{selectedWeekInteractions.length}회</Text>
                </View>

                <View style={[styles.metricCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <View style={styles.metricIconHeader}>
                    <Ionicons name="flash-outline" size={18} color="#FF9800" />
                    <Text style={[styles.metricLabel, { color: theme.subText }]}>평균 터치 강도</Text>
                  </View>
                  <Text style={[styles.metricValue, { color: theme.text }]}>
                    {selectedWeekInteractions.length > 0
                      ? Math.round(
                          selectedWeekInteractions.reduce((sum, i) => sum + (i.touchIntensity || 0), 0) /
                            selectedWeekInteractions.length
                        )
                      : 0}%
                  </Text>
                </View>
              </View>

              <View style={[styles.miniCard, { backgroundColor: theme.bg, borderColor: theme.border, alignItems: 'center' }]}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, alignSelf: 'flex-start', marginBottom: 16 }}>
                  요일별 교감 빈도 차트
                </Text>
                <BarChart
                  data={weekBarData}
                  barWidth={22}
                  spacing={14}
                  noOfSections={3}
                  barBorderRadius={5}
                  xAxisColor={theme.border}
                  hideRules
                />
              </View>

              <View style={[styles.miniCard, { backgroundColor: theme.bg, borderColor: theme.border, alignItems: 'center' }]}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, alignSelf: 'flex-start', marginBottom: 16 }}>
                  주간 주요 감정 분포
                </Text>
                <PieChart
                  data={weekPieData}
                  donut
                  radius={70}
                  innerRadius={48}
                  centerLabelComponent={() => (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text }}>
                        {selectedWeekInteractions.length}회
                      </Text>
                      <Text style={{ fontSize: 10, color: theme.subText }}>주간 감지</Text>
                    </View>
                  )}
                />

                <View style={styles.legendContainer}>
                  {Object.keys(weekEmotionMap).map((key, idx) => (
                    <View key={key} style={styles.legendTag}>
                      <View style={[styles.legendDot, { backgroundColor: colorPalette[idx % colorPalette.length] }]} />
                      <Text style={{ fontSize: 12, color: theme.text, fontWeight: '600' }}>
                        {key} ({weekEmotionMap[key]}회)
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 월간(Month) 종합 리포트 모달 */}
      <Modal
        visible={isMonthReportVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsMonthReportVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.monthReportContainer, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {currentYear}년 {currentMonth + 1}월 종합 감정 리포트
                </Text>
                <Text style={{ fontSize: 12, color: theme.subText, marginTop: 2 }}>
                  AI 심층 분석 및 상황별 트리거 진단
                </Text>
              </View>
              <Pressable onPress={() => setIsMonthReportVisible(false)} hitSlop={10}>
                <Ionicons name="close-circle" size={26} color={theme.subText} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* 핵심 요약 지표 */}
              <View style={styles.metricsRow}>
                <View style={[styles.metricCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <View style={styles.metricIconHeader}>
                    <Ionicons name="chatbubbles-outline" size={18} color={COLORS.primary} />
                    <Text style={[styles.metricLabel, { color: theme.subText }]}>월간 총 교감</Text>
                  </View>
                  <Text style={[styles.metricValue, { color: theme.text }]}>{mSummary.totalInteractions}회</Text>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: mSummary.intensityDiffPercent >= 0 ? COLORS.primary : COLORS.danger,
                      marginTop: 4,
                    }}
                  >
                    {mSummary.intensityDiffPercent >= 0 ? '▲' : '▼'} 전월 대비 {Math.abs(mSummary.intensityDiffPercent)}%
                  </Text>
                </View>

                <View style={[styles.metricCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <View style={styles.metricIconHeader}>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#4CAF50" />
                    <Text style={[styles.metricLabel, { color: theme.subText }]}>AI 케어 성공률</Text>
                  </View>
                  <Text style={[styles.metricValue, { color: '#4CAF50' }]}>{clinicalInsights.aiSuccessRate}%</Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.subText, marginTop: 4 }}>
                    정서 안정 회복 기여
                  </Text>
                </View>
              </View>

              {/* AI 인사이트 코멘트 */}
              <View
                style={[
                  styles.aiSummaryCard,
                  { backgroundColor: COLORS.primary + '12', borderColor: COLORS.primary + '30' },
                ]}
              >
                <Ionicons name="sparkles-outline" size={20} color={COLORS.primary} />
                <Text style={{ flex: 1, fontSize: 12, color: theme.text, lineHeight: 18, fontWeight: '500' }}>
                  {mSummary.aiInsightComment}
                </Text>
              </View>

              {/* 상황별(Trigger) 평균 자극 강도 순위 */}
              {topTriggers.length > 0 && (
                <View style={[styles.miniCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 12 }}>
                    상황별(Trigger) 자극 분석
                  </Text>
                  {topTriggers.map((trig, idx) => (
                    <View key={trig.context || idx} style={styles.triggerRow}>
                      <Text style={{ fontSize: 13, color: theme.text, fontWeight: '600' }}>
                        {idx + 1}. {trig.context} ({trig.count}회)
                      </Text>
                      <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: '700' }}>
                        평균 강도 {trig.avgIntensity}%
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* 월간 감정 분포 피차트 */}
              <View style={[styles.miniCard, { backgroundColor: theme.bg, borderColor: theme.border, alignItems: 'center' }]}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, alignSelf: 'flex-start', marginBottom: 16 }}>
                  월간 감정 분포 비율
                </Text>
                <PieChart
                  data={monthPieData}
                  donut
                  radius={70}
                  innerRadius={48}
                  centerLabelComponent={() => (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text }}>
                        {mSummary.totalInteractions}회
                      </Text>
                      <Text style={{ fontSize: 10, color: theme.subText }}>총 감지</Text>
                    </View>
                  )}
                />

                <View style={styles.legendContainer}>
                  {monthlyEmotionRank.map((item, idx) => (
                    <View key={item.emotion || idx} style={styles.legendTag}>
                      <View style={[styles.legendDot, { backgroundColor: colorPalette[idx % colorPalette.length] }]} />
                      <Text style={{ fontSize: 12, color: theme.text, fontWeight: '600' }}>
                        {item.emotion} ({item.count}회, {item.percentage}%)
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 감정 빈도 바 차트 */}
              <View style={[styles.miniCard, { backgroundColor: theme.bg, borderColor: theme.border, alignItems: 'center' }]}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, alignSelf: 'flex-start', marginBottom: 16 }}>
                  감정 빈도 상세 그래프
                </Text>
                <BarChart
                  data={monthBarData}
                  barWidth={26}
                  spacing={18}
                  noOfSections={3}
                  barBorderRadius={6}
                  xAxisColor={theme.border}
                  hideRules
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 아이 선택 모달 */}
      <Modal visible={isSelectModalVisible} transparent animationType="fade" onRequestClose={() => setIsSelectModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>리포트 대상 아이 선택</Text>
              <Pressable onPress={() => setIsSelectModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={theme.text} />
              </Pressable>
            </View>

            <FlatList
              data={childrenList}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => {
                const isSelected = String(selectedChild?.id) === String(item.id);
                return (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                      styles.childOptionCard,
                      {
                        backgroundColor: isSelected ? COLORS.primary + '15' : theme.bg,
                        borderColor: isSelected ? COLORS.primary : theme.border,
                      },
                    ]}
                    onPress={() => {
                      setSelectedChild(item);
                      setIsSelectModalVisible(false);
                    }}
                  >
                    <View>
                      <Text style={[styles.childOptionName, { color: theme.text }]}>{item.name}</Text>
                      <Text style={{ fontSize: 12, color: theme.subText, marginTop: 2 }}>
                        {item.gender === 'MALE' ? '남아' : '여아'} · {item.age}세
                      </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 16, paddingBottom: 30 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  childSelectBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  childSelectText: { fontSize: 13, fontWeight: '700' },
  card: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardSub: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  totalCount: { fontSize: 18, fontWeight: '800' },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  monthTitleBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  calendarMonthText: { fontSize: 15, fontWeight: '700' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 },
  weekHeaderTag: { fontSize: 11, fontWeight: '700', width: 36, textAlign: 'center' },
  weekText: { fontSize: 12, fontWeight: '700', flex: 1, textAlign: 'center' },
  calendarWeekRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  weekSelectBtn: { width: 36, height: 32, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary + '15', borderRadius: 6 },
  weekSelectText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  dayCell: { flex: 1, height: 36, justifyContent: 'center', alignItems: 'center', marginHorizontal: 2 },
  dayText: { fontSize: 13, fontWeight: '600' },
  interactionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  emotionBadge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '70%' },
  monthReportContainer: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, height: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  metricCard: { flex: 1, borderRadius: 12, padding: 14, borderWidth: 1 },
  metricIconHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  metricLabel: { fontSize: 12, fontWeight: '600' },
  metricValue: { fontSize: 20, fontWeight: '800' },
  aiSummaryCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  miniCard: { borderRadius: 12, padding: 16, borderWidth: 1, marginBottom: 16 },
  legendContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 16 },
  legendTag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  childOptionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  childOptionName: { fontSize: 15, fontWeight: '700' },
  triggerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
});