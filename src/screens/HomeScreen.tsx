import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  PanResponder,
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

// 🔑 토큰 꺼내기
const getStoredToken = async () => {
  let token = await AsyncStorage.getItem('accessToken');
  if (!token) {
    token = await AsyncStorage.getItem('token');
  }
  return token;
};

interface ChildSettings {
  isEchoMode?: boolean;     // 따라하기 모드
  friendlyMode?: boolean;   // 친근하게 말하기
  volumeLevel?: number;      // 음량 조절
  lightBrightness?: number;  // 불빛 조절
  customPrompt?: string;     // 맞춤 프롬프트
}

interface Child {
  id: string | number;
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
  isMuted?: boolean;
  isEchoMode?: boolean;
  customPrompt?: string;
  battery?: number;
  lastEmotion?: string;
  device?: { deviceId: string; volume?: number; ledpower?: number };
  settings?: ChildSettings;
}

// 🎚️ 슬라이더 조절 커스텀 컴포넌트
const CustomSlider = ({
  value,
  onValueChange,
  accentColor,
  leftIcon,
  rightIcon,
  onLeftIconPress,
}: {
  value: number; // 0 ~ 100
  onValueChange: (val: number) => void;
  accentColor: string;
  leftIcon: keyof typeof Ionicons.glyphMap;
  rightIcon: keyof typeof Ionicons.glyphMap;
  onLeftIconPress?: () => void;
}) => {
  const [sliderWidth, setSliderWidth] = useState(200);

  const calculateValueFromPageX = (pageX: number, leftX: number) => {
    const relativeX = pageX - leftX;
    const clampedX = Math.max(0, Math.min(relativeX, sliderWidth));
    const newValue = Math.round((clampedX / sliderWidth) * 100);
    onValueChange(newValue);
  };

  const trackRef = useRef<View>(null);
  const leftXRef = useRef<number>(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        trackRef.current?.measure((x, y, width, height, pageX) => {
          leftXRef.current = pageX;
          calculateValueFromPageX(evt.nativeEvent.pageX, pageX);
        });
      },
      onPanResponderMove: (evt) => {
        calculateValueFromPageX(evt.nativeEvent.pageX, leftXRef.current);
      },
    })
  ).current;

  return (
    <View style={styles.sliderWrapper}>
      <TouchableOpacity onPress={onLeftIconPress} activeOpacity={0.6} hitSlop={10}>
        <Ionicons name={leftIcon} size={22} color={value === 0 ? COLORS.danger : accentColor} />
      </TouchableOpacity>

      <View
        ref={trackRef}
        style={styles.sliderTrackBackground}
        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        <View
          style={[
            styles.sliderTrackFill,
            { width: `${Math.max(0, Math.min(value, 100))}%`, backgroundColor: value === 0 ? '#CCCCCC' : accentColor },
          ]}
        />
        <View
          style={[
            styles.sliderThumb,
            { left: `${Math.max(0, Math.min(value, 100))}%`, borderColor: value === 0 ? '#999999' : accentColor },
          ]}
        />
      </View>

      <Ionicons name={rightIcon} size={20} color="#555" />
    </View>
  );
};

export default function HomeScreen({ route, navigation }: any) {
  const { isDarkMode } = useTheme();
  const theme = getTheme(isDarkMode);
  const userRole = route?.params?.role || 'parent';
  const accent = getAccent(userRole);

  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(false);

  // ➕ 새 아이 등록 모달
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildAge, setNewChildAge] = useState('');
  const [newChildGender, setNewChildGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [newDeviceId, setNewDeviceId] = useState('1');

  // 🎛️ 인형 세부 설정 팝업 모달
  const [isSettingModalVisible, setIsSettingModalVisible] = useState(false);
  const [isEchoMode, setIsEchoMode] = useState<boolean>(false);
  const [friendlyMode, setFriendlyMode] = useState<boolean>(true);
  const [volumeLevel, setVolumeLevel] = useState<number>(50);
  const [prevVolumeLevel, setPrevVolumeLevel] = useState<number>(50);
  const [lightBrightness, setLightBrightness] = useState<number>(60);
  const [customPrompt, setCustomPrompt] = useState<string>(''); // 📝 맞춤 프롬프트 상태

  // 아이 목록 조회
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
      if (Array.isArray(res.data) && res.data.length > 0) {
        setSelectedChild((prev) => {
          if (!prev) return res.data[0];
          const matched = res.data.find((c: Child) => String(c.id) === String(prev.id));
          return matched || res.data[0];
        });
      } else {
        setSelectedChild(null);
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

  // 선택된 아이 변경 시 설정값 로드
  useEffect(() => {
    if (selectedChild) {
      const loadChildLocalSettings = async () => {
        try {
          const stored = await AsyncStorage.getItem(`child_settings_${selectedChild.id}`);
          if (stored) {
            const parsed: ChildSettings = JSON.parse(stored);
            setFriendlyMode(parsed.friendlyMode ?? true);
            setLightBrightness(parsed.lightBrightness ?? 60);
          }
        } catch (e) {
          console.error(e);
        }

        setIsEchoMode(Boolean(selectedChild.isEchoMode ?? false));
        setCustomPrompt(selectedChild.customPrompt || ''); // 백엔드 맞춤 프롬프트 동기화
        const dbVol = selectedChild.device?.volume ?? (selectedChild.isMuted ? 0 : 50);
        const dbLedPower = selectedChild.device?.ledpower ?? 60;
        setVolumeLevel(dbVol);
        if (dbVol > 0) setPrevVolumeLevel(dbVol);
        setLightBrightness(dbLedPower);
      };

      loadChildLocalSettings();
    }
  }, [selectedChild?.id]);

  // 🎛️ 백엔드 Child DTO & Device DTO 업데이트
  const updateChildSettings = async (updatedFields: {
    isEchoMode?: boolean;
    friendlyMode?: boolean;
    volumeLevel?: number;
    lightBrightness?: number;
    isMuted?: boolean;
    customPrompt?: string;
  }) => {
    if (!selectedChild) return;

    const childId = String(selectedChild.id);
    const deviceId = selectedChild.device?.deviceId || '1';

    const newEcho = updatedFields.isEchoMode ?? isEchoMode;
    const newFriendly = updatedFields.friendlyMode ?? friendlyMode;
    const newVol = updatedFields.volumeLevel ?? volumeLevel;
    const newBright = updatedFields.lightBrightness ?? lightBrightness;
    const newMuted = updatedFields.isMuted !== undefined ? updatedFields.isMuted : newVol === 0;
    const newPrompt = updatedFields.customPrompt !== undefined ? updatedFields.customPrompt : customPrompt;

    const newLocalSettings: ChildSettings = {
      isEchoMode: newEcho,
      friendlyMode: newFriendly,
      volumeLevel: newVol,
      lightBrightness: newBright,
      customPrompt: newPrompt,
    };

    // 1. AsyncStorage 저장 및 UI 상태 반영
    try {
      await AsyncStorage.setItem(`child_settings_${childId}`, JSON.stringify(newLocalSettings));
    } catch (e) {
      console.error(e);
    }

    setSelectedChild((prev) =>
      prev
        ? {
            ...prev,
            isMuted: newMuted,
            isEchoMode: newEcho,
            customPrompt: newPrompt,
            device: prev.device
              ? { ...prev.device, volume: newVol, ledpower: newBright }
              : { deviceId, volume: newVol, ledpower: newBright },
            settings: newLocalSettings,
          }
        : null
    );

    if (childId.startsWith('local_')) return;

    try {
      const token = await getStoredToken();
      if (!token) return;

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // 2. Child 엔티티 업데이트 (isMuted, isEchoMode, customPrompt -> /children/:id/settings)
      if (
        updatedFields.isMuted !== undefined ||
        updatedFields.volumeLevel !== undefined ||
        updatedFields.isEchoMode !== undefined ||
        updatedFields.customPrompt !== undefined
      ) {
        const childPatchPayload: Record<string, any> = {};
        if (updatedFields.isMuted !== undefined || updatedFields.volumeLevel !== undefined) {
          childPatchPayload.isMuted = Boolean(newMuted);
        }
        if (updatedFields.isEchoMode !== undefined) {
          childPatchPayload.isEchoMode = Boolean(newEcho);
        }
        if (updatedFields.customPrompt !== undefined) {
          childPatchPayload.customPrompt = newPrompt;
        }

        try {
          const res = await axios.patch(`${BASE_URL}/children/${childId}/settings`, childPatchPayload, { headers });
          console.log('✅ [Child DB 반영 성공]:', res.data);
          if (updatedFields.customPrompt !== undefined) {
            Alert.alert('성공', '맞춤 프롬프트가 저장되었습니다.');
          }
        } catch (err: any) {
          const errorMsg = err?.response?.data?.message || err.message;
          console.error('Child DB 반영 실패:', errorMsg);
          Alert.alert('정책 경고', typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
        }
      }

      // 3. Device 엔티티 업데이트 (volume, ledpower -> /children/device/:deviceId/settings)
      if (updatedFields.volumeLevel !== undefined || updatedFields.lightBrightness !== undefined) {
        const deviceDto: Record<string, any> = {};
        if (updatedFields.volumeLevel !== undefined) {
          deviceDto.volume = Number(newVol);
        }
        if (updatedFields.lightBrightness !== undefined) {
          deviceDto.ledpower = Number(newBright);
        }

        await axios
          .patch(`${BASE_URL}/children/device/${deviceId}/settings`, deviceDto, { headers })
          .then((res) => console.log(`✅ [Device DB 반영 성공] volume: ${newVol}, ledpower: ${newBright}`))
          .catch((err) => console.error('Device DB 반영 실패:', err?.response?.data || err.message));
      }
    } catch (err: any) {
      console.error('설정 전송 전체 오류:', err?.response?.data || err.message);
    }
  };

  // 🔊 좌측 스피커 아이콘 터치 시 음소거 토글
  const handleToggleVolumeMuteIcon = () => {
    if (volumeLevel > 0) {
      setPrevVolumeLevel(volumeLevel);
      setVolumeLevel(0);
      updateChildSettings({ volumeLevel: 0, isMuted: true });
    } else {
      const restoredVol = prevVolumeLevel > 0 ? prevVolumeLevel : 50;
      setVolumeLevel(restoredVol);
      updateChildSettings({ volumeLevel: restoredVol, isMuted: false });
    }
  };

  // ➕ 새 아이 등록
  const handleAddChild = async () => {
    if (!newChildName.trim() || !newChildAge.trim() || !newDeviceId.trim()) {
      Alert.alert('알림', '모든 정보를 입력해 주세요.');
      return;
    }

    setLoading(true);
    const localChild: Child = {
      id: `local_${Date.now()}`,
      name: newChildName.trim(),
      age: Number(newChildAge.trim()),
      gender: newChildGender,
      isMuted: false,
      isEchoMode: false,
      battery: 85,
      lastEmotion: '평온 😌',
      device: { deviceId: newDeviceId.trim(), volume: 50, ledpower: 60 },
    };

    try {
      const token = await getStoredToken();
      if (!token) {
        Alert.alert('오류', '로그인 정보가 없습니다.');
        setLoading(false);
        return;
      }

      await axios.post(
        `${BASE_URL}/children/register`,
        {
          name: newChildName.trim(),
          age: Number(newChildAge.trim()),
          gender: newChildGender,
          deviceId: newDeviceId.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('성공', '새 아이가 성공적으로 등록되었습니다.');
      setIsAddModalVisible(false);
      setNewChildName('');
      setNewChildAge('');
      setNewChildGender('MALE');
      await fetchChildren();
    } catch (err: any) {
      setChildrenList((prev) => [...prev, localChild]);
      setSelectedChild(localChild);
      setIsAddModalVisible(false);
      Alert.alert('안내', `[${newChildName}] 아이 정보가 앱에 추가되었습니다.`);
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ 아이 삭제
  const handleDeleteChild = (child: Child) => {
    Alert.alert(
      '아이 삭제',
      `정말로 '${child.name}' 어린이의 정보를 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const token = await getStoredToken();
              if (token && !String(child.id).startsWith('local_')) {
                await axios.delete(`${BASE_URL}/children/${child.id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
              }
            } catch (err) {
              console.log('서버 삭제 처리 완료');
            } finally {
              setChildrenList((prev) => {
                const newList = prev.filter((c) => String(c.id) !== String(child.id));
                if (String(selectedChild?.id) === String(child.id)) {
                  setSelectedChild(newList.length > 0 ? newList[0] : null);
                }
                return newList;
              });
              Alert.alert('삭제 완료', `${child.name} 어린이 정보가 삭제되었습니다.`);
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleEcholalia = (val: boolean) => {
    const nextVal = Boolean(val);
    setIsEchoMode(nextVal);
    updateChildSettings({ isEchoMode: nextVal });
  };

  const handleToggleFriendly = (val: boolean) => {
    const nextVal = Boolean(val);
    setFriendlyMode(nextVal);
    updateChildSettings({ friendlyMode: nextVal });
  };

  const handleChangeVolume = (val: number) => {
    const nextVal = Math.round(Number(val) || 0);
    setVolumeLevel(nextVal);
    if (nextVal > 0) setPrevVolumeLevel(nextVal);
    updateChildSettings({ volumeLevel: nextVal, isMuted: nextVal === 0 });
  };

  const handleChangeBrightness = (val: number) => {
    const nextVal = Math.round(Number(val) || 0);
    setLightBrightness(nextVal);
    updateChildSettings({ lightBrightness: nextVal });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      {/* 1. 상단 헤더 */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>아이 선택 및 관리</Text>
          <Text style={[styles.headerSub, { color: theme.subText }]}>
            등록된 아이 목록과 인형 상태를 한눈에 관리하세요
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addHeaderBtn, { backgroundColor: accent }]}
          onPress={() => setIsAddModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addHeaderBtnText}>아이 등록</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 2. 현재 선택된 아이 카드 */}
        {selectedChild ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setIsSettingModalVisible(true)}
            style={[styles.selectedCard, { backgroundColor: theme.card, borderColor: accent }]}
          >
            <View style={styles.selectedContent}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.selectedName, { color: theme.text }]}>{selectedChild.name}</Text>
                  <Ionicons name="options-outline" size={18} color={accent} />
                </View>
                <Text style={{ fontSize: 13, color: theme.subText, marginTop: 4 }}>
                  {selectedChild.gender === 'MALE' ? '👦 남아' : '👧 여아'} · {selectedChild.age}세
                </Text>
                <Text style={{ fontSize: 12, color: accent, fontWeight: '600', marginTop: 8 }}>
                  최근 상태: {selectedChild.lastEmotion || '평온 😌'} (터치하여 기능 설정 ⚙️)
                </Text>
              </View>

              <View style={styles.statusBox}>
                <View style={[styles.selectedBadge, { backgroundColor: accent + '18' }]}>
                  <Text style={{ color: accent, fontSize: 11, fontWeight: '700' }}>현재 선택됨</Text>
                </View>

                <View style={styles.statusItem}>
                  <Ionicons
                    name={(selectedChild.battery ?? 85) > 20 ? 'battery-charging-outline' : 'battery-dead-outline'}
                    size={16}
                    color={(selectedChild.battery ?? 85) > 20 ? '#4CAF50' : COLORS.danger}
                  />
                  <Text style={[styles.statusText, { color: theme.text }]}>{selectedChild.battery ?? 85}%</Text>
                </View>

                <View style={styles.statusItem}>
                  <Ionicons
                    name={volumeLevel === 0 ? 'volume-mute' : 'volume-high-outline'}
                    size={16}
                    color={volumeLevel === 0 ? COLORS.danger : COLORS.primary}
                  />
                  <Text style={[styles.statusText, { color: theme.text }]}>
                    {volumeLevel === 0 ? '음소거' : `${volumeLevel}%`}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="person-add-outline" size={32} color={theme.subText} />
            <Text style={{ color: theme.subText, marginTop: 8, fontSize: 14 }}>
              등록된 아이가 없습니다. 새 아이를 추가해 주세요.
            </Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: theme.subText }]}>전체 아이 리스트 ({childrenList.length})</Text>

        {/* 3. 아이 전체 리스트 */}
        {loading && childrenList.length === 0 ? (
          <ActivityIndicator size="large" color={accent} style={{ marginVertical: 30 }} />
        ) : (
          childrenList.map((item) => {
            const isSelected = String(selectedChild?.id) === String(item.id);
            const childBattery = item.battery ?? 85;

            return (
              <TouchableOpacity
                key={String(item.id)}
                activeOpacity={0.9}
                onPress={() => setSelectedChild(item)}
                style={[
                  styles.childCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: isSelected ? accent : theme.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.childName, { color: theme.text }]}>{item.name}</Text>
                    <Text style={{ fontSize: 13, color: theme.subText }}>
                      ({item.gender === 'MALE' ? '남아' : '여아'} / {item.age}세)
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: theme.subText, marginTop: 4 }}>
                    인형 ID: {item.device?.deviceId || 'DOLL-001'}
                  </Text>
                </View>

                <View style={styles.childControlRow}>
                  <View style={styles.batteryBadge}>
                    <Ionicons
                      name={childBattery > 20 ? 'battery-charging-outline' : 'battery-dead-outline'}
                      size={15}
                      color={childBattery > 20 ? '#4CAF50' : COLORS.danger}
                    />
                    <Text style={[styles.batteryText, { color: childBattery > 20 ? '#2E7D32' : COLORS.danger }]}>
                      {childBattery}%
                    </Text>
                  </View>

                  <Pressable onPress={() => handleDeleteChild(item)} style={{ padding: 4 }} hitSlop={8}>
                    <Ionicons name="trash-outline" size={20} color="#FF5252" />
                  </Pressable>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* 🎛️ 4. 선택된 아이 기능 설정 팝업 모달 */}
      <Modal
        visible={isSettingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsSettingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {selectedChild?.name}의 인형 사운드 & 조명 설정
                </Text>
                <Text style={{ fontSize: 12, color: theme.subText, marginTop: 2 }}>
                  스피커 아이콘을 눌러 음소거하거나 슬라이더로 조절하세요.
                </Text>
              </View>
              <Pressable onPress={() => setIsSettingModalVisible(false)} hitSlop={10}>
                <Ionicons name="close-circle" size={26} color={theme.subText} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 10 }}>
              {/* ① 따라말하기 모드 */}
              <View style={[styles.settingCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <View style={styles.settingRow}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="repeat-outline" size={18} color={accent} />
                      <Text style={[styles.settingLabel, { color: theme.text }]}>따라말하기 모드 (isEchoMode)</Text>
                    </View>
                    <Text style={[styles.settingSub, { color: theme.subText }]}>
                      인형이 한 말을 아이가 따라 말하도록 복창 유도
                    </Text>
                  </View>
                  <Switch
                    value={isEchoMode}
                    onValueChange={handleToggleEcholalia}
                    trackColor={{ false: '#E5E5E5', true: accent + '80' }}
                    thumbColor={isEchoMode ? accent : '#FFFFFF'}
                  />
                </View>
              </View>

              {/* ② 친근하게 말하기 모드 */}
              <View style={[styles.settingCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <View style={styles.settingRow}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="happy-outline" size={18} color={accent} />
                      <Text style={[styles.settingLabel, { color: theme.text }]}>친근하게 말하기</Text>
                    </View>
                    <Text style={[styles.settingSub, { color: theme.subText }]}>
                      또래 친구 같은 다정한 목소리와 말투 사용
                    </Text>
                  </View>
                  <Switch
                    value={friendlyMode}
                    onValueChange={handleToggleFriendly}
                    trackColor={{ false: '#E5E5E5', true: accent + '80' }}
                    thumbColor={friendlyMode ? accent : '#FFFFFF'}
                  />
                </View>
              </View>

              {/* ③ 🔊 출력 음량 조절 슬라이더 */}
              <View style={[styles.settingCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>출력 음량 (volume)</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: volumeLevel === 0 ? COLORS.danger : accent }}>
                    {volumeLevel === 0 ? '음소거 🔇' : `${volumeLevel}%`}
                  </Text>
                </View>

                <CustomSlider
                  value={volumeLevel}
                  onValueChange={handleChangeVolume}
                  accentColor={accent}
                  leftIcon={volumeLevel === 0 ? 'volume-mute-outline' : 'volume-low-outline'}
                  rightIcon="volume-high-outline"
                  onLeftIconPress={handleToggleVolumeMuteIcon}
                />
              </View>

              {/* ④ 💡 눈 디스플레이 불빛 조절 슬라이더 */}
              <View style={[styles.settingCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>눈 디스플레이 밝기 (ledpower)</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: accent }}>{lightBrightness}%</Text>
                </View>

                <CustomSlider
                  value={lightBrightness}
                  onValueChange={handleChangeBrightness}
                  accentColor={accent}
                  leftIcon="moon-outline"
                  rightIcon="sunny-outline"
                />
              </View>

              {/* ⑤ 📝 맞춤 프롬프트 설정 (Custom Prompt) */}
              <View style={[styles.settingCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Ionicons name="chatbox-ellipses-outline" size={18} color={accent} />
                  <Text style={[styles.settingLabel, { color: theme.text }]}>맞춤 프롬프트 설정 (customPrompt)</Text>
                </View>
                <Text style={[styles.settingSub, { color: theme.subText, marginBottom: 10 }]}>
                  인형의 성격, 말투, 반응 지침을 자유롭게 지시하세요.
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      color: theme.text,
                      borderColor: theme.border,
                      backgroundColor: theme.card,
                      height: 80,
                      textAlignVertical: 'top',
                    },
                  ]}
                  placeholder="예: 다정한 친구처럼 친근한 반말로 말해주고, 아이가 슬퍼하면 따뜻하게 다독여줘."
                  placeholderTextColor="#999"
                  multiline
                  value={customPrompt}
                  onChangeText={setCustomPrompt}
                />
                <TouchableOpacity
                  style={[styles.savePromptBtn, { backgroundColor: accent }]}
                  onPress={() => updateChildSettings({ customPrompt })}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>맞춤 프롬프트 저장하기</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 5. 새 아이 등록 팝업 모달 */}
      <Modal visible={isAddModalVisible} transparent animationType="fade" onRequestClose={() => setIsAddModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>새 아이 등록</Text>
              <Pressable onPress={() => setIsAddModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ gap: 14, paddingVertical: 10 }}>
              <View style={styles.field}>
                <Text style={[styles.inputLabel, { color: theme.subText }]}>아이 이름</Text>
                <TextInput
                  style={[styles.textInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]}
                  placeholder="예: 민준이"
                  placeholderTextColor="#999"
                  value={newChildName}
                  onChangeText={setNewChildName}
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.inputLabel, { color: theme.subText }]}>나이 (세)</Text>
                <TextInput
                  style={[styles.textInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]}
                  placeholder="예: 5"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={newChildAge}
                  onChangeText={setNewChildAge}
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.inputLabel, { color: theme.subText }]}>성별</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable
                    style={[
                      styles.genderBtn,
                      { borderColor: theme.border, backgroundColor: theme.bg },
                      newChildGender === 'MALE' && { borderColor: accent, backgroundColor: accent + '15' },
                    ]}
                    onPress={() => setNewChildGender('MALE')}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: newChildGender === 'MALE' ? accent : theme.text }}>
                      👦 남아
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.genderBtn,
                      { borderColor: theme.border, backgroundColor: theme.bg },
                      newChildGender === 'FEMALE' && { borderColor: accent, backgroundColor: accent + '15' },
                    ]}
                    onPress={() => setNewChildGender('FEMALE')}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: newChildGender === 'FEMALE' ? accent : theme.text }}>
                      👧 여아
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={[styles.inputLabel, { color: theme.subText }]}>인형 시리얼 번호 (DeviceId)</Text>
                <TextInput
                  style={[styles.textInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]}
                  placeholder="예: DOLL-001"
                  placeholderTextColor="#999"
                  value={newDeviceId}
                  onChangeText={setNewDeviceId}
                  autoCapitalize="characters"
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <Pressable
                  style={[styles.subBtn, { backgroundColor: '#E5E5E5' }]}
                  onPress={() => setIsAddModalVisible(false)}
                >
                  <Text style={{ color: '#333', fontWeight: '600' }}>취소</Text>
                </Pressable>
                <Pressable style={[styles.subBtn, { backgroundColor: accent }]} onPress={handleAddChild}>
                  <Text style={{ color: '#FFF', fontWeight: '600' }}>등록하기</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 2 },
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  addHeaderBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  scroll: { padding: 20, paddingBottom: 40 },
  selectedCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    marginBottom: 20,
  },
  selectedContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedName: { fontSize: 22, fontWeight: '800' },
  selectedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-end',
  },
  statusBox: { gap: 6, alignItems: 'flex-end' },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  emptyCard: { borderRadius: 16, padding: 30, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12, paddingLeft: 2 },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  childName: { fontSize: 16, fontWeight: '700' },
  childControlRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  batteryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 2,
  },
  batteryText: { fontSize: 11, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '88%', maxHeight: '85%', borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  field: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '600' },
  textInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15 },
  genderBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  subBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },

  // 🎛️ 스마트 설정 모달 스타일
  settingCard: { borderRadius: 14, padding: 14, borderWidth: 1 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingLabel: { fontSize: 14, fontWeight: '700' },
  settingSub: { fontSize: 12, marginTop: 4, lineHeight: 16 },

  // 🎚️ 슬라이더 트랙 디자인
  sliderWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  sliderTrackBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrackFill: {
    height: '100%',
    borderRadius: 4,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    position: 'absolute',
    top: -6,
    marginLeft: -10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  savePromptBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
});