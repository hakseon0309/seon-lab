-- ============================================================
-- 주간 메뉴: 2026-04-13 (월) ~ 2026-04-19 (일)
-- 스타필드하남점
-- Supabase Dashboard → SQL Editor → New query → 붙여넣기 → Run
-- ============================================================

DO $$
DECLARE
  loc_id uuid;
BEGIN
  SELECT id INTO loc_id FROM public.cafeteria_locations WHERE name = '스타필드하남점' LIMIT 1;

  -- ────────────────────────────────────────────────────────────
  -- 04/13 (월)
  -- ────────────────────────────────────────────────────────────

  INSERT INTO public.cafeteria_menu_items (location_id, date, meal_type, item_name, is_featured, sort_order) VALUES
  (loc_id, '2026-04-13', 'lunch', '돈육볶음', false, 1),
  (loc_id, '2026-04-13', 'lunch', '잡곡밥', false, 2),
  (loc_id, '2026-04-13', 'lunch', '근대된장국', false, 3),
  (loc_id, '2026-04-13', 'lunch', '양배추찜&쌈장', false, 4),
  (loc_id, '2026-04-13', 'lunch', '아욱볶음', false, 5),
  (loc_id, '2026-04-13', 'lunch', '배추김치', false, 6),
  (loc_id, '2026-04-13', 'lunch', '백종원비프국수&목살수육', true, 7),
  (loc_id, '2026-04-13', 'lunch', '그린샐러드', false, 8),
  (loc_id, '2026-04-13', 'lunch', '건강비빔/비빔코너', false, 9);

  INSERT INTO public.cafeteria_menu_items (location_id, date, meal_type, item_name, is_featured, sort_order) VALUES
  (loc_id, '2026-04-13', 'dinner', '오므라이스정식', true, 1),
  (loc_id, '2026-04-13', 'dinner', '잡곡밥', false, 2),
  (loc_id, '2026-04-13', 'dinner', '시금치된장국', false, 3),
  (loc_id, '2026-04-13', 'dinner', '청경채숙주무침', false, 4),
  (loc_id, '2026-04-13', 'dinner', '배추김치', false, 5),
  (loc_id, '2026-04-13', 'dinner', '깍두기', false, 6);

  -- ────────────────────────────────────────────────────────────
  -- 04/14 (화)
  -- ────────────────────────────────────────────────────────────

  INSERT INTO public.cafeteria_menu_items (location_id, date, meal_type, item_name, is_featured, sort_order) VALUES
  (loc_id, '2026-04-14', 'lunch', '함박스테이크&소스', true, 1),
  (loc_id, '2026-04-14', 'lunch', '잡곡밥', false, 2),
  (loc_id, '2026-04-14', 'lunch', '햄치즈라면', false, 3),
  (loc_id, '2026-04-14', 'lunch', '감자채피망볶음', false, 4),
  (loc_id, '2026-04-14', 'lunch', '쑥갓장수생채', false, 5),
  (loc_id, '2026-04-14', 'lunch', '배추김치', false, 6),
  (loc_id, '2026-04-14', 'lunch', '백종원비프국수&목살수육', true, 7),
  (loc_id, '2026-04-14', 'lunch', '그린샐러드', false, 8),
  (loc_id, '2026-04-14', 'lunch', '건강비빔/비빔코너', false, 9);

  INSERT INTO public.cafeteria_menu_items (location_id, date, meal_type, item_name, is_featured, sort_order) VALUES
  (loc_id, '2026-04-14', 'salad', '에그아보카도링샐러드', false, 1);

  INSERT INTO public.cafeteria_menu_items (location_id, date, meal_type, item_name, is_featured, sort_order) VALUES
  (loc_id, '2026-04-14', 'dinner', '도토리묵볶음찜&케찹', true, 1),
  (loc_id, '2026-04-14', 'dinner', '잡곡밥', false, 2),
  (loc_id, '2026-04-14', 'dinner', '감자된장국', false, 3),
  (loc_id, '2026-04-14', 'dinner', '살오징어마늘무침', false, 4),
  (loc_id, '2026-04-14', 'dinner', '조리김치', false, 5),
  (loc_id, '2026-04-14', 'dinner', '깍두기', false, 6);

  -- ────────────────────────────────────────────────────────────
  -- 04/15 (수)
  -- ────────────────────────────────────────────────────────────

  INSERT INTO public.cafeteria_menu_items (location_id, date, meal_type, item_name, is_featured, sort_order) VALUES
  (loc_id, '2026-04-15', 'lunch', '돈육김치찜', true, 1),
  (loc_id, '2026-04-15', 'lunch', '잡곡밥', false, 2),
  (loc_id, '2026-04-15', 'lunch', '유부된장국', false, 3),
  (loc_id, '2026-04-15', 'lunch', '팽이버섯튀김', false, 4),
  (loc_id, '2026-04-15', 'lunch', '청경채볶음', false, 5),
  (loc_id, '2026-04-15', 'lunch', '배추김치', false, 6),
  (loc_id, '2026-04-15', 'lunch', '그린샐러드', false, 7),
  (loc_id, '2026-04-15', 'lunch', '미니비빔밥', false, 8),
  (loc_id, '2026-04-15', 'lunch', '이채고래배추케찹', false, 9);

  INSERT INTO public.cafeteria_menu_items (location_id, date, meal_type, item_name, is_featured, sort_order) VALUES
  (loc_id, '2026-04-15', 'dinner', '가자미베이컨튀김&와사비마요', true, 1),
  (loc_id, '2026-04-15', 'dinner', '잡곡밥', false, 2),
  (loc_id, '2026-04-15', 'dinner', '김치된장국', false, 3),
  (loc_id, '2026-04-15', 'dinner', '비엔나소세지볶음', false, 4),
  (loc_id, '2026-04-15', 'dinner', '달걀야무지게무침', false, 5),
  (loc_id, '2026-04-15', 'dinner', '깍두기', false, 6);

  -- ────────────────────────────────────────────────────────────
  -- 04/16 (목)
  -- ────────────────────────────────────────────────────────────

  INSERT INTO public.cafeteria_menu_items (location_id, date, meal_type, item_name, is_featured, sort_order) VALUES
  (loc_id, '2026-04-16', 'lunch', '닭볶음탕', true, 1),
  (loc_id, '2026-04-16', 'lunch', '잡곡밥', false, 2),
  (loc_id, '2026-04-16', 'lunch', '배추된장국', false, 3),
  (loc_id, '2026-04-16', 'lunch', '매콤두부조림', false, 4),
  (loc_id, '2026-04-16', 'lunch', '새발나물볶음', false, 5),
  (loc_id, '2026-04-16', 'lunch', '배추김치', false, 6),
  (loc_id, '2026-04-16', 'lunch', '돈까스&냉면/메밀파스타', true, 7),
  (loc_id, '2026-04-16', 'lunch', '우쭈기떡볶음', false, 8),
  (loc_id, '2026-04-16', 'lunch', '배추김치', false, 9),
  (loc_id, '2026-04-16', 'lunch', '피클', false, 10);

  INSERT INTO public.cafeteria_menu_items (location_id, date, meal_type, item_name, is_featured, sort_order) VALUES
  (loc_id, '2026-04-16', 'salad', '가라아게치킨샐러드', false, 1);

  INSERT INTO public.cafeteria_menu_items (location_id, date, meal_type, item_name, is_featured, sort_order) VALUES
  (loc_id, '2026-04-16', 'dinner', '나물비빔밥', true, 1),
  (loc_id, '2026-04-16', 'dinner', '팽이된장국', false, 2),
  (loc_id, '2026-04-16', 'dinner', '참치야무지게무침', false, 3),
  (loc_id, '2026-04-16', 'dinner', '요구르트', false, 4);

  -- ────────────────────────────────────────────────────────────
  -- 04/17 (금)
  -- ────────────────────────────────────────────────────────────

  INSERT INTO public.cafeteria_menu_items (location_id, date, meal_type, item_name, is_featured, sort_order) VALUES
  (loc_id, '2026-04-17', 'lunch', '베이컨김치볶음&달걀치즈', true, 1),
  (loc_id, '2026-04-17', 'lunch', '잡곡밥', false, 2),
  (loc_id, '2026-04-17', 'lunch', '배추된장국', false, 3),
  (loc_id, '2026-04-17', 'lunch', '김치수제전', false, 4),
  (loc_id, '2026-04-17', 'lunch', '고추장양념무청', false, 5),
  (loc_id, '2026-04-17', 'lunch', '배추김치', false, 6);

  INSERT INTO public.cafeteria_menu_items (location_id, date, meal_type, item_name, is_featured, sort_order) VALUES
  (loc_id, '2026-04-17', 'salad', '소시지고구마치킨샐러드', false, 1);

  INSERT INTO public.cafeteria_menu_items (location_id, date, meal_type, item_name, is_featured, sort_order) VALUES
  (loc_id, '2026-04-17', 'dinner', '참치찜정식', true, 1),
  (loc_id, '2026-04-17', 'dinner', '잡곡밥', false, 2),
  (loc_id, '2026-04-17', 'dinner', '배추된장국', false, 3),
  (loc_id, '2026-04-17', 'dinner', '도리이마요무침', false, 4),
  (loc_id, '2026-04-17', 'dinner', '깍두기', false, 5);

  -- ────────────────────────────────────────────────────────────
  -- 04/18 (토)
  -- ────────────────────────────────────────────────────────────

  INSERT INTO public.cafeteria_menu_items (location_id, date, meal_type, item_name, is_featured, sort_order) VALUES
  (loc_id, '2026-04-18', 'lunch', '베이컨김치볶음밥&달걀치즈', true, 1),
  (loc_id, '2026-04-18', 'lunch', '미역국', false, 2),
  (loc_id, '2026-04-18', 'lunch', '생선카츠&타르타르소스', false, 3),
  (loc_id, '2026-04-18', 'lunch', '미나리나물', false, 4),
  (loc_id, '2026-04-18', 'lunch', '청경채무침', false, 5),
  (loc_id, '2026-04-18', 'lunch', '김치', false, 6),
  (loc_id, '2026-04-18', 'lunch', '설탕파래기', false, 7),
  (loc_id, '2026-04-18', 'lunch', '단무지', false, 8);

  INSERT INTO public.cafeteria_menu_items (location_id, date, meal_type, item_name, is_featured, sort_order) VALUES
  (loc_id, '2026-04-18', 'salad', '사과유자치킨샐러드', false, 1);

  INSERT INTO public.cafeteria_menu_items (location_id, date, meal_type, item_name, is_featured, sort_order) VALUES
  (loc_id, '2026-04-18', 'dinner', '사릉오지탕', true, 1),
  (loc_id, '2026-04-18', 'dinner', '잡곡밥', false, 2),
  (loc_id, '2026-04-18', 'dinner', '매콤밥볶음소스당', false, 3),
  (loc_id, '2026-04-18', 'dinner', '달걀야마무침', false, 4),
  (loc_id, '2026-04-18', 'dinner', '지리생채', false, 5),
  (loc_id, '2026-04-18', 'dinner', '깍두기', false, 6);

  -- ────────────────────────────────────────────────────────────
  -- 04/19 (일)
  -- ────────────────────────────────────────────────────────────

  INSERT INTO public.cafeteria_menu_items (location_id, date, meal_type, item_name, is_featured, sort_order) VALUES
  (loc_id, '2026-04-19', 'lunch', '돈육채', true, 1),
  (loc_id, '2026-04-19', 'lunch', '잡곡밥', false, 2),
  (loc_id, '2026-04-19', 'lunch', '두부된장국', false, 3),
  (loc_id, '2026-04-19', 'lunch', '해물완자찌개', false, 4),
  (loc_id, '2026-04-19', 'lunch', '미역오이무침', false, 5),
  (loc_id, '2026-04-19', 'lunch', '배추김치', false, 6),
  (loc_id, '2026-04-19', 'lunch', '건강유럽당근강정', false, 7),
  (loc_id, '2026-04-19', 'lunch', '배추김치', false, 8);

  INSERT INTO public.cafeteria_menu_items (location_id, date, meal_type, item_name, is_featured, sort_order) VALUES
  (loc_id, '2026-04-19', 'salad', '돈까스샐러드', false, 1);

  INSERT INTO public.cafeteria_menu_items (location_id, date, meal_type, item_name, is_featured, sort_order) VALUES
  (loc_id, '2026-04-19', 'dinner', '청양고추장찌개', true, 1),
  (loc_id, '2026-04-19', 'dinner', '잡곡밥', false, 2),
  (loc_id, '2026-04-19', 'dinner', '호박된장국', false, 3),
  (loc_id, '2026-04-19', 'dinner', '탕수어묵', false, 4),
  (loc_id, '2026-04-19', 'dinner', '깍두기', false, 5);

END $$;
