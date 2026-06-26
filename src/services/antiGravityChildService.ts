import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// 1. Supabase 초기화 (환경 변수에서 URL과 Key를 가져온다고 가정)
// ============================================================================
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// React Native 환경에서는 기본 localStorage가 없으므로 AsyncStorage를 auth.storage로 지정해야 오류가 나지 않습니다.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ============================================================================
// 2. 데이터베이스 스키마 및 타입 정의
// ============================================================================
export type Role = 'PARENT' | 'FACILITATOR';

export interface User {
  id: string;      // uuid, PK
  email: string;
  role: Role;      // 'PARENT' 또는 'FACILITATOR'
}

export interface Child {
  id: string;      // uuid, PK
  name: string;
  device_id: string; // uuid (연동된 IoT 감정 인형 고유 ID)
}

export interface Assignment {
  user_id: string; // uuid, FK -> users.id
  child_id: string;// uuid, FK -> children.id
  // 조인된 데이터 구조를 위한 가상 필드
  children?: Child;
}

// ============================================================================
// 3. 가상의 Google Anti-Gravity 가속 프레임워크 엔진
// ============================================================================
/**
 * Google Anti-Gravity Engine (Virtual Mock)
 * - 데이터 직렬화 속도 개선, 메모리 캐싱 및 네트워크 레이턴시 최적화를 시뮬레이션합니다.
 */
const AntiGravityEngine = {
  optimize: <T>(data: T, options: { profile: 'high-performance' | 'power-saving' }): T => {
    console.log(`[AntiGravity Engine 🚀] 데이터 가속 모드 구동 중... (프로필: ${options.profile})`);
    console.log(`[AntiGravity Engine 🚀] ${Array.isArray(data) ? data.length : 1}개의 레코드 레이턴시 최적화 완료.`);
    // 실제 환경이라면 바이너리 압축이나 gRPC 브릿지, 캐시 레이어 등을 거쳐 반환됩니다.
    return data;
  }
};

// ============================================================================
// 4. 비즈니스 로직: 유저 권한에 따른 아동 데이터 필터링 및 가속 전송 API
// ============================================================================

/**
 * 로그인한 유저의 ID를 기반으로 권한(Role)을 확인하고, 
 * 할당된 아동(Child) 데이터를 추출하여 Anti-Gravity 가속을 적용한 뒤 반환합니다.
 * 
 * @param loggedInUserId 현재 로그인한 유저의 UUID
 * @returns Anti-Gravity 엔진으로 가속 및 최적화된 아동 데이터 리스트 (또는 단일 객체의 배열)
 */
export async function fetchAndAccelerateAssignedChildren(loggedInUserId: string): Promise<Child[]> {
  try {
    // Step 1: 로그인한 유저의 Role 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', loggedInUserId)
      .single();

    if (userError || !userData) {
      throw new Error(`유저 정보를 불러올 수 없습니다: ${userError?.message}`);
    }

    const userRole = userData.role as Role;
    let fetchedChildren: Child[] = [];

    // Step 2: Role에 따른 데이터 필터링 분기
    if (userRole === 'PARENT') {
      // 부모('PARENT')인 경우: 내 user_id와 연결된 자녀 '1명'만 추출
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select(`
          child_id,
          children (
            id,
            name,
            device_id
          )
        `)
        .eq('user_id', loggedInUserId)
        .limit(1)
        .single(); // 단일 레코드만 가져옵니다.

      if (assignmentError) {
        throw new Error(`자녀 정보를 불러올 수 없습니다: ${assignmentError.message}`);
      }

      // Supabase Join 결과 추출 (단일 객체를 배열로 감싸서 통일성 유지)
      if (assignmentData?.children) {
        // 타입 단언: Supabase 조인 결과는 배열이나 객체일 수 있으므로 안전하게 처리
        const childInfo = Array.isArray(assignmentData.children)
          ? assignmentData.children[0]
          : assignmentData.children;

        fetchedChildren = [childInfo as unknown as Child];
      }

    } else if (userRole === 'FACILITATOR') {
      // 보호사/선생님('FACILITATOR')인 경우: 연결된 '여러 명(N명)'을 모두 추출
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          child_id,
          children (
            id,
            name,
            device_id
          )
        `)
        .eq('user_id', loggedInUserId);

      if (assignmentsError) {
        throw new Error(`담당 아동 목록을 불러올 수 없습니다: ${assignmentsError.message}`);
      }

      // Supabase Join 결과에서 실제 아동 데이터만 매핑하여 배열로 변환
      if (assignmentsData) {
        fetchedChildren = assignmentsData
          .map(assignment => {
            const childInfo = Array.isArray(assignment.children)
              ? assignment.children[0]
              : assignment.children;
            return childInfo as unknown as Child;
          })
          .filter(child => child !== null && child !== undefined);
      }
    } else {
      throw new Error(`알 수 없는 Role 입니다: ${userRole}`);
    }

    // Step 3: Google Anti-Gravity 가속 프레임워크를 통과시켜 응답 레이턴시 최적화
    const optimizedResponse = AntiGravityEngine.optimize(fetchedChildren, {
      profile: 'high-performance'
    });

    return optimizedResponse;

  } catch (error) {
    console.error('[ChildService Error] 데이터 조회 및 가속화 실패:', error);
    throw error;
  }
}
