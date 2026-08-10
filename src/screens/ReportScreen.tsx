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

export default function ReportScreen() {
  const { isDarkMode } = useTheme();
  const theme = getTheme(isDarkMode);

  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [isSelectModalVisible, setIsSelectModalVisible] = useState(false);

  // 📆 달력 상태 (기본값: 오늘)
  const todayObj = new Date();
  const [currentYear, setCurrentYear] = useState(todayObj.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(todayObj.getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    todayObj.toISOString().split('T')[0]
  );

  // 이번 달 1일~말일 기준 데이터 저장
  const [monthInteractions, setMonthInteractions] = useState<InteractionItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 📊 월간 종합 리포트 팝업 모달
  const [isMonthReportVisible, setIsMonthReportVisible] = useState(false);

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

  // 2. 이번 달 [1일 00:00:00 ~ 말일 23:59:59] 범위 상호작용 기록 조회
  const fetchThisMonthInteractionsData = async () => {
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

      const now = new Date();
      const thisYear = now.getFullYear();
      const thisMonth = now.getMonth();

      const formattedMonth = String(thisMonth + 1).padStart(2, '0');
      const firstDayStr = `${thisYear}-${formattedMonth}-01`;

      let fetchedRaw: InteractionItem[] = [];

      try {
        const res = await axios.get(
          `${BASE_URL}/children/${childId}/interactions?date=${firstDayStr}`,
          { headers }
        );
        if (Array.isArray(res.data)) {
          fetchedRaw = res.data;
        }
      } catch (e) {
        fetchedRaw = [];
      }

      const startDate = new Date(thisYear, thisMonth, 1, 0, 0, 0, 0);
      const endDate = new Date(thisYear, thisMonth + 1, 0, 23, 59, 59, 999);

      const monthFiltered = fetchedRaw.filter((item) => {
        if (!item.createdAt) return false;
        const itemDate = new Date(item.createdAt);
        return itemDate >= startDate && itemDate <= endDate;
      });

      setMonthInteractions(monthFiltered.length > 0 ? monthFiltered : fetchedRaw);
    } catch (err) {
      setMonthInteractions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThisMonthInteractionsData();
  }, [selectedChild?.id]);

  // 선택된 날짜(selectedDateStr)의 데이터 추출
  const selectedDayInteractions = monthInteractions.filter((item) => {
    if (!item.createdAt) return false;
    const itemDateStr = new Date(item.createdAt).toISOString().split('T')[0];
    return itemDateStr === selectedDateStr;
  });

  // 달력 계산
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

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
    const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
    setSelectedDateStr(dateStr);
  };

  // 📊 차트 집계 데이터
  const emotionMap: Record<string, number> = {};
  monthInteractions.forEach((item) => {
    const emotion = item.detectedEmotion || '평온';
    emotionMap[emotion] = (emotionMap[emotion] || 0) + 1;
  });

  const monthlyEmotionRank: EmotionRankItem[] = Object.keys(emotionMap).map((key) => ({
    name: key,
    count: emotionMap[key],
  }));

  const emptyColor = isDarkMode ? COLORS.dark.border : COLORS.border;
  const colorPalette = [COLORS.primary, '#4CAF50', '#FF9800', '#E91E63', COLORS.secondary];

  const pieData =
    monthlyEmotionRank.length > 0
      ? monthlyEmotionRank.map((s, idx) => ({
          value: s.count,
          color: colorPalette[idx % colorPalette.length],
        }))
      : [{ value: 1, color: emptyColor }];

  const barData =
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
        {/* 🔝 1. 상단 타이틀 & 아이 선택 드롭다운 */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>감정 분석 리포트</Text>
            {selectedChild && (
              <Text style={{ fontSize: 12, color: theme.subText, marginTop: -14, marginBottom: 14 }}>
                {selectedChild.gender === 'MALE' ? '👦 남아' : '👧 여아'} · {selectedChild.age}세
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
            {selectedDateStr} 기준 <Text style={{ color: COLORS.primary }}>{selectedDayInteractions.length}회</Text> 감지
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
                {currentYear}년 {currentMonth + 1}월 리포트 📊
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNextMonth} hitSlop={10}>
              <Ionicons name="chevron-forward" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
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

          <View style={styles.daysGrid}>
            {Array.from({ length: firstDayOfWeek }).map((_, index) => (
              <View key={`empty-${index}`} style={styles.dayCell} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, index) => {
              const dayNum = index + 1;
              const formattedMonth = String(currentMonth + 1).padStart(2, '0');
              const formattedDay = String(dayNum).padStart(2, '0');
              const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;

              const isSelected = dateStr === selectedDateStr;
              const isToday = dateStr === todayObj.toISOString().split('T')[0];

              return (
                <TouchableOpacity
                  key={`day-${dayNum}`}
                  style={[
                    styles.dayCell,
                    isSelected && { backgroundColor: COLORS.primary, borderRadius: 20 },
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
        </View>

        {/* 📋 4. 선택한 날짜 상세 상호작용 리스트 카드 */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 14 }}>
            {selectedDateStr} 교감 상세 내역 목록
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
          ) : selectedDayInteractions.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Ionicons name="chatbubbles-outline" size={28} color={theme.subText} />
              <Text style={{ color: theme.subText, marginTop: 6, fontSize: 13 }}>
                선택한 날짜에 감지된 상호작용 기록이 없습니다.
              </Text>
            </View>
          ) : (
            selectedDayInteractions.map((item, idx) => {
              let timeDisplay = selectedDateStr;
              if (item.createdAt) {
                const itemDate = new Date(item.createdAt);
                timeDisplay = itemDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }

              return (
                <View
                  key={item.id || idx}
                  style={[
                    styles.interactionRow,
                    idx !== selectedDayInteractions.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
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

      {/* 📊 5. 월간 종합 리포트 팝업 모달 */}
      <Modal visible={isMonthReportVisible} transparent animationType="slide" onRequestClose={() => setIsMonthReportVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.monthReportContainer, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  이번 달(1일~말일) 종합 감정 리포트
                </Text>
                <Text style={{ fontSize: 12, color: theme.subText, marginTop: 2 }}>
                  이번 달 전체 감정 비율과 빈도를 분석합니다.
                </Text>
              </View>
              <Pressable onPress={() => setIsMonthReportVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={[styles.miniCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <Text style={{ fontSize: 13, color: theme.subText }}>이번 달 총 교감 신호</Text>
                <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.primary, marginTop: 2 }}>
                  {monthInteractions.length}회
                </Text>
              </View>

              <View style={[styles.miniCard, { backgroundColor: theme.bg, borderColor: theme.border, alignItems: 'center' }]}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, alignSelf: 'flex-start', marginBottom: 16 }}>
                  월간 감정 분포 비율
                </Text>
                <PieChart
                  data={pieData}
                  donut
                  radius={75}
                  innerRadius={50}
                  centerLabelComponent={() => (
                    <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text }}>{monthInteractions.length}회</Text>
                  )}
                />
              </View>

              <View style={[styles.miniCard, { backgroundColor: theme.bg, borderColor: theme.border, alignItems: 'center' }]}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, alignSelf: 'flex-start', marginBottom: 16 }}>
                  월간 감정 빈도 분석 그래프
                </Text>
                <BarChart
                  data={barData}
                  barWidth={28}
                  spacing={20}
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

      {/* 🔽 아이 선택 팝업 모달 */}
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
              ListEmptyComponent={
                <Text style={{ textAlign: 'center', color: theme.subText, marginVertical: 20 }}>
                  등록된 아이가 없습니다.
                </Text>
              }
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
                        {item.gender === 'MALE' ? '👦 남아' : '👧 여아'} · {item.age}세
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
    justifyContent: 'space-between', // 👈 justifyContent 교정 완료
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
    justifyContent: 'space-between', // 👈 justifyContent 교정 완료
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  weekText: {
    width: '13%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start', // 👈 justifyContent 교정 완료
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    justifyContent: 'center', // 👈 justifyContent 교정 완료
    alignItems: 'center',
    marginVertical: 2,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },

  interactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // 👈 justifyContent 교정 완료
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

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }, // 👈 justifyContent 교정 완료
  modalContainer: { width: '85%', maxHeight: '70%', borderRadius: 20, padding: 20 },
  monthReportContainer: { width: '90%', maxHeight: '85%', borderRadius: 20, padding: 20 },
  miniCard: { borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, // 👈 justifyContent 교정 완료
  modalTitle: { fontSize: 16, fontWeight: '700' },
  childOptionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between', // 👈 justifyContent 교정 완료
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  childOptionName: { fontSize: 15, fontWeight: '700' },
});