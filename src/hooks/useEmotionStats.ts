import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { EmotionStat, EmotionType } from '../types/emotion';

// ✅ 버그 2 수정: ReportScreen의 탭 텍스트와 일치시킴
export type Period = '오늘' | '이번 주' | '이번 달';

export function useEmotionStats(deviceId: string, period: Period) {
  const [stats, setStats] = useState<EmotionStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0); // ✅ 버그 3 수정: total 상태 추가

  useEffect(() => {
    if (!deviceId) return;

    async function fetchStats() {
      setLoading(true);
      const now = new Date();
      let startDate = new Date();
      
      // 기간 계산 (한글 기준)
      if (period === '오늘') startDate.setHours(0, 0, 0, 0);
      else if (period === '이번 주') startDate.setDate(now.getDate() - 7);
      else startDate.setMonth(now.getMonth() - 1);

      const { data, error } = await supabase
        .from('touch_events')
        .select('emotion_code') // ✅ 실제 컬럼명 사용
        .eq('device_id', deviceId)
        .gte('occurred_at', startDate.toISOString());

      if (error) {
        console.error('[Stats] 조회 실패:', error.message);
        setLoading(false);
        return;
      }

      const totalCount = data?.length || 0;
      setTotal(totalCount); // ✅ total 값 업데이트

      const counts: Record<string, number> = {};
      data?.forEach((row) => {
        const code = row.emotion_code as string;
        counts[code] = (counts[code] || 0) + 1;
      });

      const formattedStats: EmotionStat[] = Object.entries(counts).map(([emotion, count]) => ({
        emotion: emotion as EmotionType,
        count,
        percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
      }));

      setStats(formattedStats.sort((a, b) => b.count - a.count));
      setLoading(false);
    }

    fetchStats();
  }, [deviceId, period]);

  return { stats, loading, total }; // ✅ total 포함 반환
}