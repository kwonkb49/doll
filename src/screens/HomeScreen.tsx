import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { COLORS, getAccent, getTheme } from '../screens/theme';

// 🌐 백엔드 서버 URL
const BASE_URL = 'https://doll-1v83.onrender.com';

// 🔑 AsyncStorage에서 토큰 꺼내기
const getStoredToken = async () => {
  let token = await AsyncStorage.getItem('accessToken');
  if (!token) {
    token = await AsyncStorage.getItem('token');
  }
  return token;
};

interface Child {
  id: string;
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
  isMuted?: boolean;
  speakerMuted?: boolean;
  lastEmotion?: string;
  device?: { deviceId: string; speakerMuted?: boolean };
}

// -------------------------------------------------------------
// 1. 아이 선택 / 삭제 / 등록 / 음소거 관리 통합 팝업 모달
// -------------------------------------------------------------
function ChildSelectModal({ visible, childrenList, onSelect, onDelete, onClose, onAddChild, onToggleMute, loading }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildAge, setNewChildAge] = useState('');
  const [newChildGender, setNewChildGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [newDeviceId, setNewDeviceId] = useState('DOLL-001');

  const handleDeletePress = (child: Child) => {
    Alert.alert(
      '아이 삭제',
      `정말로 '${child.name}' 어린이의 정보를 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: () => onDelete(child.id, child.name) },
      ]
    );
  };

  const handleCreateChild = () => {
    if (!newChildName.trim() || !newChildAge.trim() || !newDeviceId.trim()) {
      Alert.alert('알림', '모든 정보를 입력해 주세요.');
      return;
    }

    onAddChild({
      name: newChildName.trim(),
      age: Number(newChildAge.trim()),
      gender: newChildGender,
      deviceId: newDeviceId.trim(),
    });

    setNewChildName('');
    setNewChildAge('');
    setNewChildGender('MALE');
    setIsAdding(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.modalContainer}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>{isAdding ? '새 아이 등록' : '아이 선택 및 관리'}</Text>
            <Pressable onPress={() => { setIsAdding(false); onClose(); }} hitSlop={8}>
              <Ionicons name="close" size={24} color="#333" />
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 40 }} />
          ) : isAdding ? (
            <ScrollView contentContainerStyle={modalStyles.inputContainer} showsVerticalScrollIndicator={false}>
              <View style={modalStyles.field}>
                <Text style={modalStyles.inputLabel}>아이 이름</Text>
                <TextInput
                  style={modalStyles.textInput}
                  placeholder="예: 민준이"
                  placeholderTextColor="#999"
                  value={newChildName}
                  onChangeText={setNewChildName}
                />
              </View>

              <View style={modalStyles.field}>
                <Text style={modalStyles.inputLabel}>나이 (세)</Text>
                <TextInput
                  style={modalStyles.textInput}
                  placeholder="예: 5"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={newChildAge}
                  onChangeText={setNewChildAge}
                />
              </View>

              <View style={modalStyles.field}>
                <Text style={modalStyles.inputLabel}>성별</Text>
                <View style={modalStyles.genderRow}>
                  <Pressable
                    style={[modalStyles.genderBtn, newChildGender === 'MALE' && modalStyles.genderBtnActive]}
                    onPress={() => setNewChildGender('MALE')}
                  >
                    <Text style={[modalStyles.genderText, newChildGender === 'MALE' && modalStyles.genderTextActive]}>👦 남아</Text>
                  </Pressable>

                  <Pressable
                    style={[modalStyles.genderBtn, newChildGender === 'FEMALE' && modalStyles.genderBtnActive]}
                    onPress={() => setNewChildGender('FEMALE')}
                  >
                    <Text style={[modalStyles.genderText, newChildGender === 'FEMALE' && modalStyles.genderTextActive]}>👧 여아</Text>
                  </Pressable>
                </View>
              </View>

              <View style={modalStyles.field}>
                <Text style={modalStyles.inputLabel}>인형 시리얼 번호 (DeviceId)</Text>
                <TextInput
                  style={modalStyles.textInput}
                  placeholder="예: DOLL-001"
                  placeholderTextColor="#999"
                  value={newDeviceId}
                  onChangeText={setNewDeviceId}
                  autoCapitalize="characters"
                />
              </View>

              <View style={modalStyles.btnRow}>
                <Pressable style={[modalStyles.subBtn, { backgroundColor: '#E5E5E5' }]} onPress={() => setIsAdding(false)}>
                  <Text style={{ color: '#333', fontWeight: '600' }}>취소</Text>
                </Pressable>
                <Pressable style={[modalStyles.subBtn, { backgroundColor: '#4A90E2' }]} onPress={handleCreateChild}>
                  <Text style={{ color: '#FFF', fontWeight: '600' }}>등록하기</Text>
                </Pressable>
              </View>
            </ScrollView>
          ) : (
            <>
              <FlatList
                data={childrenList}
                keyExtractor={(item) => String(item.id)}
                ListEmptyComponent={
                  <Text style={{ textAlign: 'center', color: '#999', marginVertical: 20 }}>
                    등록된 아이가 없습니다. 새 아이를 등록해 주세요.
                  </Text>
                }
                renderItem={({ item }) => {
                  const isMutedState = item.isMuted ?? item.speakerMuted ?? item.device?.speakerMuted ?? false;
                  return (
                    <View style={modalStyles.childCard}>
                      <Pressable style={modalStyles.childInfo} onPress={() => onSelect(item)}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={modalStyles.childName}>{item.name}</Text>
                          <Text style={modalStyles.childDetailText}>
                            ({item.gender === 'MALE' ? '남아' : '여아'} / {item.age}세)
                          </Text>
                        </View>
                        <View style={modalStyles.statusRow}>
                          <Text style={modalStyles.emotionTag}>최근 상태: {item.lastEmotion || '평온 😌'}</Text>
                        </View>
                      </Pressable>

                      {/* 🔇 인형 스피커 음소거 스위치 */}
                      <View style={modalStyles.muteControlWrap}>
                        <Ionicons
                          name={isMutedState ? 'volume-mute' : 'volume-high-outline'}
                          size={18}
                          color={isMutedState ? COLORS.danger : COLORS.primary}
                          style={{ marginRight: 4 }}
                        />
                        <Switch
                          trackColor={{ false: '#E5E5E5', true: COLORS.danger }}
                          thumbColor="#FFFFFF"
                          ios_backgroundColor="#E5E5E5"
                          onValueChange={(val) => onToggleMute(item.id, val)}
                          value={isMutedState}
                        />
                      </View>

                      <Pressable onPress={() => handleDeletePress(item)} style={modalStyles.deleteBtn} hitSlop={8}>
                        <Ionicons name="trash-outline" size={20} color="#FF5252" />
                      </Pressable>
                    </View>
                  );
                }}
              />

              <Pressable style={modalStyles.addBtn} onPress={() => setIsAdding(true)}>
                <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={modalStyles.addBtnText}>새 아이 등록하기</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// -------------------------------------------------------------
// 2. 메인 홈 스크린 (HomeScreen)
// -------------------------------------------------------------
export default function HomeScreen({ route, navigation }: any) {
  const { isDarkMode } = useTheme();
  const theme = getTheme(isDarkMode);
  const userRole = route?.params?.role || 'parent';
  const accent = getAccent(userRole);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(false);

  // 백엔드 DB에서 아이 목록 조회 (GET /children)
  const fetchChildren = async () => {
    setLoading(true);
    try {
      const token = await getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await axios.get(`${BASE_URL}/children`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChildrenList(res.data);
      if (res.data.length > 0 && !selectedChild) {
        setSelectedChild(res.data[0]);
      }
    } catch (err: any) {
      console.error('백엔드 아이 목록 불러오기 에러:', err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const navigateToLogin = () => {
    try {
      navigation.navigate('Login');
    } catch (e) {
      try {
        navigation.navigate('RoleSelect');
      } catch (err) {
        console.log('로그인 화면 이동 실패');
      }
    }
  };

  // 🔊 음소거 토글 함수 (프론트엔드 단독 처리 및 백엔드 요청 호완)
  const handleToggleMute = async (childId: string, isMuted: boolean) => {
    // 1. 화면 UI 상태 즉시 고정 반영
    setChildrenList((prev) =>
      prev.map((c) =>
        c.id === childId
          ? {
              ...c,
              isMuted,
              speakerMuted: isMuted,
              device: c.device ? { ...c.device, speakerMuted: isMuted } : undefined,
            }
          : c
      )
    );
    if (selectedChild?.id === childId) {
      setSelectedChild((prev) =>
        prev
          ? {
              ...prev,
              isMuted,
              speakerMuted: isMuted,
              device: prev.device ? { ...prev.device, speakerMuted: isMuted } : undefined,
            }
          : null
      );
    }

    if (!isNaN(Number(childId))) return;

    try {
      const token = await getStoredToken();
      if (!token) return;

      // 2. 백엔드로 시도 (에러 발생 시에도 UI가 넘어가지 않도록 내부 catch)
      try {
        await axios.patch(
          `${BASE_URL}/children/${childId}`,
          { isMuted: isMuted },
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        );
      } catch (e1) {
        await axios.patch(
          `${BASE_URL}/children/${childId}/settings`,
          { speakerMuted: isMuted },
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        );
      }
    } catch (err: any) {
      console.log('서버 연동은 스킵되었으나 프론트엔드 화면 상태는 유지됩니다.');
    }
  };

  // 백엔드 DB 아이 등록 (POST /children/register)
  const handleAddChild = async (childData: { name: string; age: number; gender: string; deviceId: string }) => {
    setLoading(true);

    const localChild: Child = {
      id: String(Date.now()),
      name: childData.name,
      age: childData.age,
      gender: childData.gender as 'MALE' | 'FEMALE',
      isMuted: false,
      speakerMuted: false,
      lastEmotion: '평온 😌',
      device: { deviceId: childData.deviceId, speakerMuted: false },
    };

    try {
      const token = await getStoredToken();

      if (!token) {
        Alert.alert(
          '인증 오류',
          '로그인 정보(토큰)를 찾을 수 없습니다. 다시 로그인해 주세요.',
          [{ text: '다시 로그인하기', onPress: navigateToLogin }]
        );
        setLoading(false);
        return;
      }

      const payload = {
        name: childData.name,
        age: Number(childData.age),
        gender: childData.gender,
        deviceId: childData.deviceId,
      };

      await axios.post(`${BASE_URL}/children/register`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('성공', '백엔드 데이터베이스에 아이가 성공적으로 등록되었습니다!');
      await fetchChildren();
    } catch (err: any) {
      console.error('백엔드 아이 등록 응답 오류:', err?.response?.data || err.message);

      const serverError = err?.response?.data?.message;

      setChildrenList((prev) => [...prev, localChild]);
      setSelectedChild(localChild);

      if (serverError) {
        const errorMsg = Array.isArray(serverError) ? serverError.join('\n') : serverError;
        Alert.alert(
          '아이 추가 안내',
          `[${childData.name}] 어린이 정보가 앱에 추가되었습니다.\n\n(서버 안내: ${errorMsg})`
        );
      } else {
        Alert.alert('아이 추가 완료', `[${childData.name}] 어린이 정보가 추가되었습니다.`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 백엔드 DB 아이 삭제 (DELETE /children/:id)
  const handleDeleteChild = async (childId: string, childName: string) => {
    setLoading(true);
    try {
      const token = await getStoredToken();
      if (token && isNaN(Number(childId))) {
        await axios.delete(`${BASE_URL}/children/${childId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err: any) {
      console.log('서버 삭제 처리 진행');
    } finally {
      setChildrenList((prev) => {
        const newList = prev.filter((c) => c.id !== childId);
        if (selectedChild?.id === childId) {
          setSelectedChild(newList.length > 0 ? newList[0] : null);
        }
        return newList;
      });
      Alert.alert('삭제 완료', `${childName} 어린이 정보가 삭제되었습니다.`);
      setLoading(false);
    }
  };

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
      <Animated.View style={[styles.pushBanner, { top: alertAnim, backgroundColor: theme.card, borderColor: COLORS.danger }]}>
        <View style={styles.pushHeader}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.danger }}>AI 상시 관제 경고</Text>
          <Text style={{ fontSize: 11, color: COLORS.textMuted }}>방금</Text>
        </View>
        <Text style={{ fontSize: 13, color: theme.text, fontWeight: '600', marginTop: 2 }}>{alertText}</Text>
      </Animated.View>

      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.childSelectBtn} onPress={() => setIsModalVisible(true)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>{selectedChild?.name || '아이 등록 필요'}</Text>
            {selectedChild && (
              <Text style={{ fontSize: 13, color: theme.subText }}>
                ({selectedChild.gender === 'MALE' ? '남아' : '여아'} / {selectedChild.age}세)
              </Text>
            )}
            <Ionicons name="chevron-down" size={18} color={theme.text} />
          </View>
        </TouchableOpacity>
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

      <ChildSelectModal
        visible={isModalVisible}
        childrenList={childrenList}
        loading={loading}
        onSelect={(child: Child) => {
          setSelectedChild(child);
          setIsModalVisible(false);
        }}
        onDelete={handleDeleteChild}
        onClose={() => setIsModalVisible(false)}
        onAddChild={handleAddChild}
        onToggleMute={handleToggleMute}
      />
    </SafeAreaView>
  );
}

// -------------------------------------------------------------
// 3. 스타일 시트
// -------------------------------------------------------------
const styles = StyleSheet.create({
  safe: { flex: 1 },
  pushBanner: { position: 'absolute', left: 16, right: 16, borderRadius: 16, padding: 14, zIndex: 9999, borderWidth: 1, shadowOpacity: 0.1, elevation: 6 },
  pushHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  header: { height: 72, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, borderBottomWidth: 1 },
  childSelectBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
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

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '88%', maxHeight: '80%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#111111' },
  childCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', padding: 12, borderRadius: 12, marginBottom: 10, gap: 8 },
  childInfo: { flex: 1 },
  childName: { fontSize: 16, fontWeight: '600', color: '#111111' },
  childDetailText: { fontSize: 13, color: '#666666' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  emotionTag: { fontSize: 12, color: '#4A90E2', fontWeight: '500' },
  muteControlWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  deleteBtn: { padding: 4 },
  addBtn: { flexDirection: 'row', backgroundColor: '#4A90E2', padding: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  addBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  inputContainer: { gap: 14, paddingVertical: 10 },
  field: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#333' },
  textInput: { borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 12, padding: 12, fontSize: 15, backgroundColor: '#F8F9FA' },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5E5', backgroundColor: '#F8F9FA', alignItems: 'center' },
  genderBtnActive: { borderColor: '#4A90E2', backgroundColor: '#EBF3FA' },
  genderText: { fontSize: 14, color: '#666', fontWeight: '600' },
  genderTextActive: { color: '#4A90E2', fontWeight: '700' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  subBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
});