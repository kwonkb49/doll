// src/screens/HomeScreen.tsx

import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRealtimeEmotion } from '../hooks/useRealtimeEmotion';
import { EMOTION_CONFIG, EmotionType, toPercent } from '../types/emotion';


const DEVICE_ID = '961804ad-1abc-43cd-af82-936272481ec5';

export default function HomeScreen() {
  const { latestEvent, eventHistory, isConnected } = useRealtimeEmotion(DEVICE_ID);

  // ── [에러 방지 핵심 로직] ──────────────────────────────────────
  // 1. emotion_code가 있는지 먼저 확인하고, 정의된 키인지 검사합니다.
  const rawEmotion = latestEvent?.emotion_code || 'UNKNOWN';
  const emotionKey = (EMOTION_CONFIG[rawEmotion as EmotionType] 
    ? rawEmotion 
    : 'UNKNOWN') as EmotionType;

  const config = EMOTION_CONFIG[emotionKey];
  const pressurePercent = latestEvent ? toPercent(latestEvent.pressure_raw) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* 헤더 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>강원대학교 캡스톤 디자인</Text>
          <Text style={styles.headerTitle}>KNU Emotion Doll</Text>
        </View>
        <View style={[
          styles.badge,
          { backgroundColor: isConnected ? '#6BCB77' : '#FF6B6B' },
        ]}>
          <Text style={styles.badgeText}>{isConnected ? '● 실시간' : '○ 연결중'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* 현재 상태 카드 */}
        <View style={[styles.emotionCard, { borderColor: config.color + '55' }]}>
          <Text style={styles.emoji}>{config.emoji}</Text>
          <Text style={[styles.emotionLabel, { color: config.color }]}>{config.label}</Text>
          
          <Text style={styles.timeText}>
            {latestEvent 
              ? `마지막 감지: ${new Date(latestEvent.occurred_at).toLocaleTimeString('ko-KR')}`
              : '인형의 데이터를 기다리고 있습니다...'}
          </Text>

          {/* 감정 강도 바 */}
          <View style={styles.barRow}>
            <Text style={styles.barLabel}>터치 강도</Text>
            <View style={styles.barBg}>
              <View style={[styles.barFill, {
                width: `${pressurePercent}%`,
                backgroundColor: config.color,
              }]} />
            </View>
            <Text style={[styles.barValue, { color: config.color }]}>{pressurePercent}%</Text>
          </View>
          
          {latestEvent?.body_part && (
            <Text style={styles.bodyPartText}>감지 부위: {latestEvent.body_part}</Text>
          )}
        </View>

        {/* 최근 기록 리스트 */}
        <Text style={styles.sectionTitle}>최근 감정 기록</Text>
        {eventHistory.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>아직 기록이 없습니다 🌱</Text>
          </View>
        ) : (
          [...eventHistory].reverse().slice(0, 10).map((ev, index) => {
            const evKey = (EMOTION_CONFIG[ev.emotion_code as EmotionType] ? ev.emotion_code : 'UNKNOWN') as EmotionType;
            const cfg = EMOTION_CONFIG[evKey];
            return (
              <View key={index} style={styles.timelineItem}>
                <Text style={styles.tlEmoji}>{cfg.emoji}</Text>
                <View style={styles.tlContent}>
                  <Text style={[styles.tlEmotion, { color: cfg.color }]}>{cfg.label}</Text>
                  <Text style={styles.tlTime}>{new Date(ev.occurred_at).toLocaleString('ko-KR')}</Text>
                </View>
                <Text style={styles.tlBodyPart}>{ev.body_part}</Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerSub: { fontSize: 10, color: '#999', fontWeight: 'bold' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#333' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  scroll: { padding: 20 },
  emotionCard: { backgroundColor: '#fff', borderRadius: 25, padding: 30, alignItems: 'center', borderWidth: 2, marginBottom: 25, elevation: 5 },
  emoji: { fontSize: 80, marginBottom: 10 },
  emotionLabel: { fontSize: 35, fontWeight: '900' },
  timeText: { fontSize: 13, color: '#aaa', marginVertical: 15 },
  barRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: 10 },
  barLabel: { fontSize: 12, color: '#666', width: 60 },
  barBg: { flex: 1, height: 8, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barValue: { fontSize: 12, fontWeight: 'bold', width: 40, textAlign: 'right' },
  bodyPartText: { marginTop: 15, fontSize: 12, color: '#666', fontStyle: 'italic' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  timelineItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 10 },
  tlEmoji: { fontSize: 25, marginRight: 15 },
  tlContent: { flex: 1 },
  tlEmotion: { fontSize: 16, fontWeight: 'bold' },
  tlTime: { fontSize: 11, color: '#bbb', marginTop: 2 },
  tlBodyPart: { fontSize: 12, color: '#999', fontWeight: '600' },
  emptyCard: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#ccc' }
});