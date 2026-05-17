import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { EmotionType, TouchEvent } from '../types/emotion';

export function useRealtimeEmotion(deviceId: string) {
  const [latestEvent, setLatestEvent] = useState<TouchEvent | null>(null);
  const [eventHistory, setEventHistory] = useState<TouchEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!deviceId) return;

    // ── 1) 초기 데이터 로드 ────────────────────────────────────
    const fetchInitial = async () => {
      const { data, error } = await supabase
        .from('touch_events')
        .select('*') // 'id' 에러 방지를 위해 전체 선택
        .eq('device_id', deviceId)
        .order('occurred_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('[Supabase] 초기 로드 실패:', error.message);
        return;
      }

      // 최신 데이터를 마지막으로 보내기 위해 reverse
      setEventHistory((data as TouchEvent[]).reverse());
      if (data.length > 0) setLatestEvent(data[0] as TouchEvent);
    };

    fetchInitial();

    // ── 2) Realtime 구독 ───────────────────────────────────────
    const channelName = `touch_events_${deviceId.replace(/-/g, '_')}`;

    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'touch_events',
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          const newEvent = payload.new as TouchEvent;
          setLatestEvent(newEvent);
          // 최대 50개 기록 유지
          setEventHistory((prev) => [...prev, newEvent].slice(-50));
          
          // ✅ 버그 1 수정: emotion -> emotion_code (실제 DB 필드명 참조)
          triggerHaptics(newEvent.emotion_code);
        }
      )
      .subscribe((status, err) => {
        console.log('[Realtime] 상태:', status, err ?? '');
        setIsConnected(status === 'SUBSCRIBED');
      });

    // ── 3) Cleanup ─────────────────────────────────────────────
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [deviceId]);

  return { latestEvent, eventHistory, isConnected };
}

// 감정별 햅틱 피드백 로직
async function triggerHaptics(emotion: EmotionType) {
  try {
    switch (emotion) {
      case 'JOY':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'ANGER':
      case 'ANXIOUS':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'SAD':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'CALM':
        await Haptics.selectionAsync();
        break;
      default:
        break;
    }
  } catch {
    // 햅틱 미지원 기기 무시
  }
}