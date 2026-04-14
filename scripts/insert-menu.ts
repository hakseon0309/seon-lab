/**
 * 주간 식단 메뉴 입력 스크립트
 *
 * 사용법:
 *   npx tsx scripts/insert-menu.ts
 *
 * 환경변수 필요:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Claude가 이미지에서 파싱한 데이터를 아래 MENU_DATA, SCORES 배열에 채운 뒤 실행
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── 지점 이름 ──
const LOCATION_NAME = "스타필드하남점";

// ── 메뉴 데이터 ──
interface MenuEntry {
  date: string; // 'YYYY-MM-DD'
  meal_type: "lunch" | "dinner" | "salad";
  items: { name: string; featured?: boolean }[];
}

const MENU_DATA: MenuEntry[] = [
  // ═══ 4/6 (월) ═══
  {
    date: "2026-04-06",
    meal_type: "lunch",
    items: [
      { name: "돈육장조림", featured: true },
      { name: "잡곡밥" },
      { name: "어묵국" },
      { name: "달걀야채찜" },
      { name: "상추생채무침" },
      { name: "배추김치" },
      { name: "꼬치어묵우동", featured: true },
      { name: "김가루후리카케밥" },
      { name: "회오리감자" },
      { name: "단무지" },
    ],
  },
  {
    date: "2026-04-06",
    meal_type: "salad",
    items: [
      { name: "그린샐러드/비빔코너" },
      { name: "치킨텐더샐러드" },
    ],
  },
  {
    date: "2026-04-06",
    meal_type: "dinner",
    items: [
      { name: "경상도고깃국", featured: true },
      { name: "잡곡밥" },
      { name: "미니돈까스&케찹" },
      { name: "무나물볶음" },
      { name: "부추생채" },
      { name: "배추김치" },
    ],
  },

  // ═══ 4/7 (화) ═══
  {
    date: "2026-04-07",
    meal_type: "lunch",
    items: [
      { name: "고추장불고기", featured: true },
      { name: "잡곡밥" },
      { name: "근대된장국" },
      { name: "곤약탕평채무침" },
      { name: "쌈무" },
      { name: "배추김치" },
      { name: "고구마치즈돈까스", featured: true },
      { name: "추가밥" },
      { name: "크림스프" },
      { name: "샐러드파스타" },
      { name: "마늘빵/단무지" },
    ],
  },
  {
    date: "2026-04-07",
    meal_type: "salad",
    items: [
      { name: "숭늉/비빔코너" },
      { name: "마카로니샐러드" },
    ],
  },
  {
    date: "2026-04-07",
    meal_type: "dinner",
    items: [
      { name: "통태무조림", featured: true },
      { name: "잡곡밥" },
      { name: "맑은콩나물국" },
      { name: "소면야채무침" },
      { name: "건파래볶음" },
      { name: "배추김치" },
    ],
  },

  // ═══ 4/8 (수) ═══
  {
    date: "2026-04-08",
    meal_type: "lunch",
    items: [
      { name: "소고기육개장", featured: true },
      { name: "잡곡밥" },
      { name: "두부구이&양념장" },
      { name: "연근땅콩조림" },
      { name: "다시마쌈&쌈장" },
      { name: "깍두기" },
      { name: "보배반점st.크림탕봉", featured: true },
      { name: "야채볶음밥" },
      { name: "고추잡채만두*초간장" },
      { name: "짜사이무침" },
      { name: "배추김치" },
    ],
  },
  {
    date: "2026-04-08",
    meal_type: "salad",
    items: [
      { name: "새우/비빔코너" },
      { name: "베이컨리가토니샐러드" },
    ],
  },
  {
    date: "2026-04-08",
    meal_type: "dinner",
    items: [
      { name: "안동찜닭", featured: true },
      { name: "잡곡밥" },
      { name: "김칫국" },
      { name: "어묵볶음" },
      { name: "벚꽃요거트" },
      { name: "깍두기" },
    ],
  },

  // ═══ 4/9 (목) ═══
  {
    date: "2026-04-09",
    meal_type: "lunch",
    items: [
      { name: "차돌된장찌개", featured: true },
      { name: "잡곡밥" },
      { name: "연유옥수수전" },
      { name: "알감자조림" },
      { name: "미나리무생채" },
      { name: "배추김치" },
      { name: "비빔꼴면", featured: true },
      { name: "맑은우동국물" },
      { name: "미니볶음밥" },
      { name: "못난이핫도그&케찹" },
      { name: "단무지" },
    ],
  },
  {
    date: "2026-04-09",
    meal_type: "salad",
    items: [
      { name: "그린샐러드/비빔코너" },
      { name: "치킨팝샐러드" },
    ],
  },
  {
    date: "2026-04-09",
    meal_type: "dinner",
    items: [
      { name: "새우까스&콘마요소스", featured: true },
      { name: "잡곡밥" },
      { name: "감자고추장국" },
      { name: "비엔나볶음" },
      { name: "양념깻잎지" },
      { name: "깍두기" },
    ],
  },

  // ═══ 4/10 (금) ═══
  {
    date: "2026-04-10",
    meal_type: "lunch",
    items: [
      { name: "불맛오징어볶음", featured: true },
      { name: "잡곡밥" },
      { name: "시래기된장국" },
      { name: "오븐콘치즈구이" },
      { name: "청경채생채" },
      { name: "배추김치" },
      { name: "일본식카레라이스", featured: true },
      { name: "&렌치까스" },
      { name: "오복지" },
    ],
  },
  {
    date: "2026-04-10",
    meal_type: "salad",
    items: [
      { name: "그린샐러드/비빔코너" },
      { name: "깐풍기샐러드" },
    ],
  },
  {
    date: "2026-04-10",
    meal_type: "dinner",
    items: [
      { name: "장조림버터비빔밥", featured: true },
      { name: "미역국" },
      { name: "고추마요치킨" },
      { name: "유자치커리생채" },
      { name: "배추김치" },
    ],
  },

  // ═══ 4/11 (토) ═══
  {
    date: "2026-04-11",
    meal_type: "lunch",
    items: [
      { name: "대패삼겹살김치찌개", featured: true },
      { name: "잡곡밥" },
      { name: "그릴모듬소시지볶음" },
      { name: "명엽채조림" },
      { name: "열무나물" },
      { name: "깍두기" },
      { name: "해물볶음밥", featured: true },
      { name: "&간장치킨" },
      { name: "팽이미소국" },
      { name: "그린샐러드" },
      { name: "쥬시쿨" },
    ],
  },
  {
    date: "2026-04-11",
    meal_type: "salad",
    items: [
      { name: "건빵튀김/비빔코너" },
      { name: "불고기메밀면샐러드" },
    ],
  },
  {
    date: "2026-04-11",
    meal_type: "dinner",
    items: [
      { name: "묵은지곤드레밥&양념장", featured: true },
      { name: "팽이미소국" },
      { name: "고추바사삭돈가츠*칠리S" },
      { name: "참치무조림" },
      { name: "콩자반" },
      { name: "배추김치" },
    ],
  },

  // ═══ 4/12 (일) ═══
  {
    date: "2026-04-12",
    meal_type: "lunch",
    items: [
      { name: "셀프나물비빔밥", featured: true },
      { name: "&달걀후라이" },
      { name: "비빔고추장/참기름" },
      { name: "유부장국" },
      { name: "물만두찜&초간장" },
      { name: "배추김치" },
      { name: "냉도토리묵사발", featured: true },
      { name: "김밥볶음밥" },
      { name: "계란볶이" },
      { name: "오복지무침" },
    ],
  },
  {
    date: "2026-04-12",
    meal_type: "salad",
    items: [
      { name: "숭늉/비빔코너" },
      { name: "하이프로틴샐러드" },
    ],
  },
  {
    date: "2026-04-12",
    meal_type: "dinner",
    items: [
      { name: "탕수육&소스", featured: true },
      { name: "잡곡밥" },
      { name: "달걀국" },
      { name: "버섯잡채" },
      { name: "해초무침" },
      { name: "배추김치" },
    ],
  },
];

// ── 점수 데이터 ──
interface ScoreEntry {
  date: string;
  meal_type: "lunch" | "dinner" | "salad";
  score: number; // 0.0 ~ 5.0
  comment: string;
}

const SCORES: ScoreEntry[] = [
  // ── 중식 ──
  { date: "2026-04-06", meal_type: "lunch", score: 3.5, comment: "돈육장조림 무난, 어묵우동 조합 괜찮음" },
  { date: "2026-04-07", meal_type: "lunch", score: 4.5, comment: "불고기+돈까스 투메인, 무조건 중식" },
  { date: "2026-04-08", meal_type: "lunch", score: 4.0, comment: "육개장 든든+크림탕봉, 반찬 균형 좋음" },
  { date: "2026-04-09", meal_type: "lunch", score: 3.5, comment: "차돌된장찌개 무난, 비빔꼴면+핫도그 분식 조합" },
  { date: "2026-04-10", meal_type: "lunch", score: 4.0, comment: "오징어볶음 매콤+카레&렌치까스 든든한 금요일" },
  { date: "2026-04-11", meal_type: "lunch", score: 4.5, comment: "대패삼겹살+간장치킨, 이날 최고 조합" },
  { date: "2026-04-12", meal_type: "lunch", score: 2.5, comment: "비빔밥+묵사발 담백, 특별함은 부족" },

  // ── 석식 ──
  { date: "2026-04-06", meal_type: "dinner", score: 3.0, comment: "고깃국 호불호 있지만 미니돈까스가 구원" },
  { date: "2026-04-07", meal_type: "dinner", score: 2.5, comment: "생선조림 호불호 강함, 반찬도 단조로움" },
  { date: "2026-04-08", meal_type: "dinner", score: 4.0, comment: "안동찜닭 인기 메뉴, 충분히 갈만한 석식" },
  { date: "2026-04-09", meal_type: "dinner", score: 4.5, comment: "새우까스 특식 대만족, 비엔나까지 든든" },
  { date: "2026-04-10", meal_type: "dinner", score: 3.5, comment: "장조림비빔밥+고추마요치킨, 무난하게 좋음" },
  { date: "2026-04-11", meal_type: "dinner", score: 3.5, comment: "곤드레밥에 바사삭돈가츠 조합 괜찮음" },
  { date: "2026-04-12", meal_type: "dinner", score: 4.5, comment: "탕수육 특식 만족도 높음, 반찬도 균형" },
];

async function main() {
  // 1. 지점 ID 조회
  const { data: loc, error: locError } = await supabase
    .from("cafeteria_locations")
    .select("id")
    .eq("name", LOCATION_NAME)
    .single();

  if (locError || !loc) {
    console.error("지점을 찾을 수 없습니다:", LOCATION_NAME, locError);
    process.exit(1);
  }

  const locationId = loc.id;
  console.log(`지점: ${LOCATION_NAME} (${locationId})`);

  // 2. 기존 데이터 삭제 (해당 날짜 범위)
  const dates = [...new Set(MENU_DATA.map((m) => m.date))].sort();
  if (dates.length > 0) {
    console.log(`날짜 범위: ${dates[0]} ~ ${dates[dates.length - 1]}`);

    await supabase
      .from("cafeteria_menu_items")
      .delete()
      .eq("location_id", locationId)
      .gte("date", dates[0])
      .lte("date", dates[dates.length - 1]);

    await supabase
      .from("cafeteria_meal_scores")
      .delete()
      .eq("location_id", locationId)
      .gte("date", dates[0])
      .lte("date", dates[dates.length - 1]);
  }

  // 3. 메뉴 항목 삽입
  const menuRows = MENU_DATA.flatMap((entry) =>
    entry.items.map((item, idx) => ({
      location_id: locationId,
      date: entry.date,
      meal_type: entry.meal_type,
      item_name: item.name,
      is_featured: item.featured ?? false,
      sort_order: idx,
    }))
  );

  if (menuRows.length > 0) {
    const { error: menuError } = await supabase
      .from("cafeteria_menu_items")
      .insert(menuRows);

    if (menuError) {
      console.error("메뉴 삽입 실패:", menuError);
      process.exit(1);
    }
    console.log(`메뉴 ${menuRows.length}개 삽입 완료`);
  }

  // 4. 점수 삽입
  const scoreRows = SCORES.map((s) => ({
    location_id: locationId,
    date: s.date,
    meal_type: s.meal_type,
    score: s.score,
    comment: s.comment,
  }));

  if (scoreRows.length > 0) {
    const { error: scoreError } = await supabase
      .from("cafeteria_meal_scores")
      .insert(scoreRows);

    if (scoreError) {
      console.error("점수 삽입 실패:", scoreError);
      process.exit(1);
    }
    console.log(`점수 ${scoreRows.length}개 삽입 완료`);
  }

  console.log("완료!");
}

main();
