// src/types/emotion.ts

export type EmotionType = 'JOY' | 'SAD' | 'ANGER' | 'ANXIOUS' | 'CALM' | 'UNKNOWN';

export interface TouchEvent {
  // 실제 Supabase 테이블(touch_events)의 컬럼명과 100% 일치시킴
  occurred_at: string;
  body_part: string;
  pressure_raw: number;
  duration_ms: number;
  emotion_code: EmotionType; // ✅ emotion -> emotion_code로 수정
  device_id?: string;
}

export const EMOTION_CONFIG: Record<EmotionType, { emoji: string; color: string; label: string }> = {
  JOY:     { emoji: '😊', color: '#FFD93D', label: '기쁨' },
  SAD:     { emoji: '😢', color: '#6C9BD2', label: '슬픔' },
  ANGER:   { emoji: '😠', color: '#FF6B6B', label: '분노' },
  ANXIOUS: { emoji: '😰', color: '#A78BFA', label: '불안' },
  CALM:    { emoji: '😌', color: '#6BCB77', label: '평온' },
  UNKNOWN: { emoji: '❓', color: '#9CA3AF', label: '미감지' },
};

// pressure_raw(0~1000)를 퍼센트로 변환하는 유틸리티
export const toPercent = (raw: number): number => {
  if (!raw) return 0;
  return Math.round((raw / 1000) * 100);
};