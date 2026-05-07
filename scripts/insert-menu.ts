/**
 * 직원 식당 메뉴 입력 스크립트
 *
 * 사용법:
 *   npx tsx scripts/insert-menu.ts
 *
 * 필요한 환경 변수:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * 점수/코멘트 기능은 사용하지 않는다. 메뉴명과 강조 여부만 입력한다.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const LOCATION_NAME = "스타필드 하남점";

type MealType = "lunch" | "dinner" | "salad";

interface MenuEntry {
  date: string;
  meal_type: MealType;
  items: { name: string; featured?: boolean }[];
}

const MENU_DATA: MenuEntry[] = [
  // 예시:
  // {
  //   date: "2026-05-05",
  //   meal_type: "lunch",
  //   items: [
  //     { name: "제육볶음", featured: true },
  //     { name: "잡곡밥" },
  //     { name: "미역국" },
  //   ],
  // },
];

async function main() {
  if (MENU_DATA.length === 0) {
    console.log("MENU_DATA가 비어 있습니다. 입력할 메뉴를 먼저 채워주세요.");
    return;
  }

  const { data: location, error: locationError } = await supabase
    .from("cafeteria_locations")
    .select("id")
    .eq("name", LOCATION_NAME)
    .single();

  if (locationError || !location) {
    throw new Error(
      `식당 위치를 찾지 못했습니다: ${locationError?.message ?? LOCATION_NAME}`
    );
  }

  const dates = [...new Set(MENU_DATA.map((entry) => entry.date))];
  const mealTypes = [...new Set(MENU_DATA.map((entry) => entry.meal_type))];

  const { error: deleteError } = await supabase
    .from("cafeteria_menu_items")
    .delete()
    .eq("location_id", location.id)
    .in("date", dates)
    .in("meal_type", mealTypes);

  if (deleteError) {
    throw new Error(`기존 메뉴 삭제 실패: ${deleteError.message}`);
  }

  const rows = MENU_DATA.flatMap((entry) =>
    entry.items.map((item, index) => ({
      location_id: location.id,
      date: entry.date,
      meal_type: entry.meal_type,
      item_name: item.name,
      is_featured: item.featured ?? false,
      sort_order: index + 1,
    }))
  );

  const { error: insertError } = await supabase
    .from("cafeteria_menu_items")
    .insert(rows);

  if (insertError) {
    throw new Error(`메뉴 삽입 실패: ${insertError.message}`);
  }

  console.log(`메뉴 ${rows.length}개를 입력했습니다.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
