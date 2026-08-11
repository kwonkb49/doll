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
}

interface EmotionRankItem {
  name: string;
  count: number;
}

// 💡 날짜 문자열을 YYYY-MM-DD로 안전하게 추출하는 유틸 함수
const parseDateString = (dateInput: string | Date | undefined): string => {
  if (!dateInput) return '';
  try {
    if (typeof dateInput === 'string' && dateInput.includes('T')) {
      return dateInput.split('T')[0];
    }
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

  // 📆 달력 및 날짜 상태
  const todayObj = new Date();
  const [currentYear, setCurrentYear] = useState(todayObj.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(todayObj.getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(parseDateString(todayObj));

  // 📊 모달 상태
  const [isMonthReportVisible, setIsMonthReportVisible] = useState(false);
  const [isWeekReportVisible, setIsWeekReportVisible] = useState(false);
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(0);

  // 상호작용 원본 데이터 및 로딩 상태
  const [allInteractions, setAllInteractions] = useState<InteractionItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. 등록된 아이 목록 불러오기
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

  // 2. 전체 상호작용 기록 조회 (응답 데이터 구조 안전성 강화)
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
      const res = await axios.get(`${BASE_URL}/children/${childId}/interactions`, { headers });

      // 백엔드 응답이 객체 내부에 배열로 감싸져있거나 바로 배열인 경우 모두 대응
      let rawData = res.data;
      if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
        rawData = rawData.interactions || rawData.data || rawData.list || [];
      }

      const fetchedList: InteractionItem[] = Array.isArray(rawData) ? rawData : [];
      setAllInteractions(fetchedList);
    } catch (err) {
      setAllInteractions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllInteractions();
  }, [selectedChild?.id]);

  // 🗓️ 달력 계산 변수
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

  // -------------------------------------------------------------
  // 📋 [1] 일별 데이터 필터링 (날짜 문자열 비교)
  // -------------------------------------------------------------
  const dailyInteractions = allInteractions.filter((item) => {
    if (!item || !item.createdAt) return false;
    return parseDateString(item.createdAt) === selectedDateStr;
  });

  // -------------------------------------------------------------
  // 📊 [2] 월별 데이터 필터링 (이번 달 & 지난달)
  // -------------------------------------------------------------
  const monthInteractions = allInteractions.filter((item) => {
    if (!item || !item.createdAt) return false;
    const dateStr = parseDateString(item.createdAt);
    if (!dateStr) return false;
    const [yyyy, mm] = dateStr.split('-');
    return Number(yyyy) === currentYear && Number(mm) === currentMonth + 1;
  });

  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;

  const prevMonthInteractions = allInteractions.filter((item) => {
    if (!item || !item.createdAt) return false;
    const dateStr = parseDateString(item.createdAt);
    if (!dateStr) return false;
    const [yyyy, mm] = dateStr.split('-');
    return Number(yyyy) === prevYear && Number(mm) === prevMonth + 1;
  });

  // -------------------------------------------------------------
  // 📊 [3] 주별 데이터 필터링 (백엔드 제안 로직 적용)
  // -------------------------------------------------------------
  const selectedWeekInteractions = monthInteractions.filter((item) => {
    if (!item || !item.createdAt) return false;
    const d = new Date(item.createdAt);
    if (isNaN(d.getTime())) return false;
    if (d.getFullYear() !== currentYear || d.getMonth() !== currentMonth) return false;
    const dayNum = d.getDate();
    const weekIdx = Math.floor((dayNum + firstDayOfWeek - 1) / 7);
    return weekIdx === selectedWeekNum;
  });

  // 주간 요일별 빈도
  const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0];
  selectedWeekInteractions.forEach((item) => {
    if (item.createdAt) {
      const d = new Date(item.createdAt);
      if (!isNaN(d.getTime())) {
        dayOfWeekCounts[d.getDay()] += 1;
      }
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

  const weekdayCount = dayOfWeekCounts.slice(1, 6).reduce((a, b) => a + b, 0);
  const weekendCount = dayOfWeekCounts[0] + dayOfWeekCounts[6];

  const weekEmotionMap: Record<string, number> = {};
  selectedWeekInteractions.forEach((item) => {
    const emotion = item.detectedEmotion || '평온';
    weekEmotionMap[emotion] = (weekEmotionMap[emotion] || 0) + 1;
  });

  const weekEmotionRank: EmotionRankItem[] = Object.keys(weekEmotionMap).map((key) => ({
    name: key,
    count: weekEmotionMap[key],
  }));

  const emptyColor = isDarkMode ? COLORS.dark.border : COLORS.border;
  const colorPalette = [COLORS.primary, '#4CAF50', '#FF9800', '#E91E63', COLORS.secondary];

  const weekPieData =
    weekEmotionRank.length > 0
      ? weekEmotionRank.map((s, idx) => ({
          value: s.count,
          color: colorPalette[idx % colorPalette.length],
        }))
      : [{ value: 1, color: emptyColor }];

  // -------------------------------------------------------------
  // 📊 월별 차트 지표 계산
  // -------------------------------------------------------------
  const currentTotal = monthInteractions.length;
  const prevTotal = prevMonthInteractions.length;
  const countDiff = currentTotal - prevTotal;
  const percentChange = prevTotal > 0 ? Math.round((countDiff / prevTotal) * 100) : 0;

  const getPositiveRatio = (list: InteractionItem[]) => {
    if (list.length === 0) return 0;
    const posCount = list.filter((item) =>
      ['기쁨', '행복', '평온', '즐거움', '안정'].includes(item.detectedEmotion || '평온')
    ).length;
    return Math.round((posCount / list.length) * 100);
  };

  const currentPosRatio = getPositiveRatio(monthInteractions);
  const prevPosRatio = getPositiveRatio(prevMonthInteractions);
  const posRatioDiff = currentPosRatio - prevPosRatio;

  const monthEmotionMap: Record<string, number> = {};
  monthInteractions.forEach((item) => {
    const emotion = item.detectedEmotion || '평온';
    monthEmotionMap[emotion] = (monthEmotionMap[emotion] || 0) + 1;
  });

  const monthlyEmotionRank: EmotionRankItem[] = Object.keys(monthEmotionMap).map((key) => ({
    name: key,
    count: monthEmotionMap[key],
  }));

  const monthPieData =
    monthlyEmotionRank.length > 0
      ? monthlyEmotionRank.map((s, idx) => ({
          value: s.count,
          color: colorPalette[idx % colorPalette.length],
        }))
      : [{ value: 1, color: emptyColor }];

  const monthBarData =
    monthlyEmotionRank.length > 0
      ? monthlyEmotionRank.map((s, idx) => ({
          value: s.count,
          label: s.name,
          frontColor: colorPalette[idx % colorPalette.length],
          topLabelComponent: () => (
            <Text style={{ color: theme.text, fontSize: 11, fontWeight: '700', marginBottom: 2 }}>
              {s.count}회
            </Text>
          ),
        }))
      : [{ value: 0, label: '-', frontColor: emptyColor }];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* 🔝 1. 상단 타이틀 & 아이 선택 */}
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

        {/* 2. 상단 요약 카드 */}
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

        {/* 📅 3. 달력 카드 */}
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
                {currentYear}년 {currentMonth + 1}월 리포트
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

          {/* 달력 주차 행 */}
          {Array.from({ length: totalWeeks }).map((_, weekIdx) => (
            <View key={`week-row-${weekIdx}`} style={styles.calendarWeekRow}>
              {/* 📌 주차 선택 버튼 */}
              <TouchableOpacity
                style={styles.weekSelectBtn}
                onPress={() => handleOpenWeekReport(weekIdx)}
                activeOpacity={0.7}
              >
                <Text style={styles.weekSelectText}>{weekIdx + 1}주</Text>
              </TouchableOpacity>

              {/* 7일간의 날짜 셀 */}
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
                const isToday = dateStr === parseDateString(todayObj);

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

        {/* 📋 4. 선택한 날짜 상세 목록 */}
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
                } catch (e) {
                  timeDisplay = selectedDateStr;
                }
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

      {/* 📊 5. 주별(Week) 종합 리포트 팝업 모달 */}
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
                    <Ionicons name="people-outline" size={18} color="#4CAF50" />
                    <Text style={[styles.metricLabel, { color: theme.subText }]}>평일 vs 주말</Text>
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text, marginTop: 2 }}>
                    평일 {weekdayCount}회 / 주말 {weekendCount}회
                  </Text>
                </View>
              </View>

              <View style={[styles.aiSummaryCard, { backgroundColor: COLORS.primary + '12', borderColor: COLORS.primary + '30' }]}>
                <Ionicons name="sparkles-outline" size={20} color={COLORS.primary} />
                <Text style={{ flex: 1, fontSize: 12, color: theme.text, lineHeight: 18, fontWeight: '500' }}>
                  {weekendCount > weekdayCount
                    ? `이번 ${selectedWeekNum + 1}주차는 주말에 교감 신호가 더욱 집중되었습니다. 아이가 주말에 인형을 더 자주 방문했습니다.`
                    : `이번 ${selectedWeekNum + 1}주차는 평일에 꾸준한 교감 신호가 감지되었습니다. 일상적인 대화 패턴이 안정적입니다.`}
                </Text>
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
                      <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text }}>{selectedWeekInteractions.length}회</Text>
                      <Text style={{ fontSize: 10, color: theme.subText }}>주간 감지</Text>
                    </View>
                  )}
                />

                <View style={styles.legendContainer}>
                  {weekEmotionRank.map((item, idx) => (
                    <View key={item.name} style={styles.legendTag}>
                      <View style={[styles.legendDot, { backgroundColor: colorPalette[idx % colorPalette.length] }]} />
                      <Text style={{ fontSize: 12, color: theme.text, fontWeight: '600' }}>
                        {item.name} ({item.count}회)
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 📊 6. 월간(Month) 종합 리포트 팝업 모달 */}
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
                  전월 대비 교감 변화 및 감정 분석
                </Text>
              </View>
              <Pressable onPress={() => setIsMonthReportVisible(false)} hitSlop={10}>
                <Ionicons name="close-circle" size={26} color={theme.subText} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={styles.metricsRow}>
                <View style={[styles.metricCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <View style={styles.metricIconHeader}>
                    <Ionicons name="chatbubbles-outline" size={18} color={COLORS.primary} />
                    <Text style={[styles.metricLabel, { color: theme.subText }]}>월간 교감</Text>
                  </View>
                  <Text style={[styles.metricValue, { color: theme.text }]}>{currentTotal}회</Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: countDiff >= 0 ? COLORS.primary : COLORS.danger, marginTop: 4 }}>
                    {prevTotal === 0 ? '기록 없음' : `${countDiff >= 0 ? '▲' : '▼'} ${Math.abs(percentChange)}%`}
                  </Text>
                </View>

                <View style={[styles.metricCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <View style={styles.metricIconHeader}>
                    <Ionicons name="happy-outline" size={18} color="#4CAF50" />
                    <Text style={[styles.metricLabel, { color: theme.subText }]}>긍정 감정</Text>
                  </View>
                  <Text style={[styles.metricValue, { color: '#4CAF50' }]}>{currentPosRatio}%</Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: posRatioDiff >= 0 ? '#4CAF50' : COLORS.danger, marginTop: 4 }}>
                    {prevTotal === 0 ? '기록 없음' : `${posRatioDiff >= 0 ? '▲' : '▼'} ${Math.abs(posRatioDiff)}%p`}
                  </Text>
                </View>
              </View>

              <View style={[styles.aiSummaryCard, { backgroundColor: COLORS.primary + '12', borderColor: COLORS.primary + '30' }]}>
                <Ionicons name="sparkles-outline" size={20} color={COLORS.primary} />
                <Text style={{ flex: 1, fontSize: 12, color: theme.text, lineHeight: 18, fontWeight: '500' }}>
                  {countDiff >= 0
                    ? `지난달보다 아이의 인형 교감 신호가 ${Math.abs(percentChange)}% 늘어났습니다. 아이와의 친밀도가 안정적으로 높아지고 있습니다.`
                    : `아이의 인형 교감 신호가 지난달에 비해 다소 줄어들었습니다. 아이의 일상 변화를 함께 살펴봐주세요.`}
                </Text>
              </View>

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
                      <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text }}>{currentTotal}회</Text>
                      <Text style={{ fontSize: 10, color: theme.subText }}>총 감지</Text>
                    </View>
                  )}
                />

                <View style={styles.legendContainer}>
                  {monthlyEmotionRank.map((item, idx) => (
                    <View key={item.name} style={styles.legendTag}>
                      <View style={[styles.legendDot, { backgroundColor: colorPalette[idx % colorPalette.length] }]} />
                      <Text style={{ fontSize: 12, color: theme.text, fontWeight: '600' }}>
                        {item.name} ({item.count}회)
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

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

      {/* 🔽 아이 선택 모달 */}
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
  container: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  childSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  childSelectText: { fontSize: 13, fontWeight: '700' },
  card: { borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1 },
  cardSub: { fontSize: 13, marginBottom: 4 },
  totalCount: { fontSize: 18, fontWeight: '700' },

  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  monthTitleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '12',
  },
  calendarMonthText: { fontSize: 15, fontWeight: '700' },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  weekHeaderTag: {
    width: '14%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
  },
  weekText: {
    width: '11.5%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },

  calendarWeekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
    marginVertical: 1,
  },
  weekSelectBtn: {
    width: '14%',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.primary + '18',
  },
  weekSelectText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  dayCell: {
    width: '11.5%',
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
  },

  interactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  emotionBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '85%', maxHeight: '70%', borderRadius: 20, padding: 20 },
  monthReportContainer: { width: '90%', maxHeight: '85%', borderRadius: 20, padding: 20 },
  miniCard: { borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  childOptionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  childOptionName: { fontSize: 15, fontWeight: '700' },

  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  metricIconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  aiSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
  },
  legendTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});