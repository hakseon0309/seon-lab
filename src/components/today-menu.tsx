"use client";

import { createClient } from "@/lib/supabase/client";
import { getSeoulDateKey, isTradersHoliday } from "@/lib/time";
import {
  CafeteriaLocation,
  CafeteriaMenuItem,
} from "@/lib/types";
import { useEffect, useState } from "react";

interface MealSection {
  mealType: "lunch" | "dinner" | "salad";
  label: string;
  timeRange: string;
  items: CafeteriaMenuItem[];
}

export default function TodayMenu() {
  const [location, setLocation] = useState<CafeteriaLocation | null>(null);
  const [meals, setMeals] = useState<MealSection[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadMenu() {
      // 1. 지점 가져오기 (첫 번째 지점)
      const { data: locations } = await supabase
        .from("cafeteria_locations")
        .select("*")
        .limit(1);

      if (!locations || locations.length === 0) {
        setLoading(false);
        return;
      }

      const loc = locations[0] as CafeteriaLocation;
      setLocation(loc);

      // 2. 오늘 날짜 (서울 기준)
      const todayKey = getSeoulDateKey(new Date());

      // 3. 오늘 메뉴 조회
      const { data: menuData } = await supabase
        .from("cafeteria_menu_items")
        .select("*")
        .eq("location_id", loc.id)
        .eq("date", todayKey)
        .order("sort_order", { ascending: true });

      const items = (menuData || []) as CafeteriaMenuItem[];

      // 4. 끼니별 그룹핑
      const formatTime = (t: string) => t.slice(0, 5); // "11:30:00" -> "11:30"
      const allSections: MealSection[] = [
        {
          mealType: "lunch" as const,
          label: "중식",
          timeRange: `${formatTime(loc.lunch_start)}–${formatTime(loc.lunch_end)}`,
          items: items.filter((i) => i.meal_type === "lunch"),
        },
        {
          mealType: "salad" as const,
          label: "샐러드",
          timeRange: `${formatTime(loc.lunch_start)}–${formatTime(loc.lunch_end)}`,
          items: items.filter((i) => i.meal_type === "salad"),
        },
        {
          mealType: "dinner" as const,
          label: "석식",
          timeRange: `${formatTime(loc.dinner_start)}–${formatTime(loc.dinner_end)}`,
          items: items.filter((i) => i.meal_type === "dinner"),
        },
      ];
      const sections = allSections.filter((s) => s.items.length > 0);

      setMeals(sections);
      setLoading(false);
    }

    loadMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return null;
  if (!location) return null;

  const formatTime = (t: string) => t.slice(0, 5);
  const tradersHoliday = isTradersHoliday(new Date());

  const todayLabel = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date());

  return (
    <div className="mt-4 px-4 lg:px-0">
      <div className="mb-1 flex items-baseline justify-between">
        <h2
          className="text-base font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          오늘의 직원 식당 메뉴
        </h2>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {location.name} · {todayLabel}
        </span>
      </div>
      <p className="mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
        중식 {formatTime(location.lunch_start)}–{formatTime(location.lunch_end)}
        &nbsp;·&nbsp;
        석식 {formatTime(location.dinner_start)}–{formatTime(location.dinner_end)}
      </p>

      <div
        className="mb-3 rounded-lg px-3 py-2 text-xs font-medium"
        style={
          tradersHoliday
            ? { backgroundColor: "var(--error-bg)", color: "var(--error)" }
            : { backgroundColor: "var(--success-bg)", color: "var(--success)" }
        }
      >
        {tradersHoliday ? "오늘은 트레이더스 휴무일입니다" : "오늘은 트레이더스 영업일입니다"}
      </div>

      {meals.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          오늘 등록된 메뉴가 없습니다.
        </p>
      ) : (
        <div className="space-y-3">
          {meals.map((meal) => (
            <div
              key={meal.mealType}
              className="rounded-lg border p-3"
              style={{
                borderColor: "var(--border-light)",
                backgroundColor: "var(--bg-card)",
              }}
            >
              <p
                className="mb-2 text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {meal.label}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {meal.items.map((item) => (
                  <span
                    key={item.id}
                    className="rounded-md px-2 py-0.5 text-xs"
                    style={
                      item.is_featured
                        ? {
                            backgroundColor: "var(--event-bg)",
                            color: "var(--event-text)",
                            fontWeight: 600,
                          }
                        : {
                            backgroundColor: "var(--bg-surface)",
                            color: "var(--text-secondary)",
                          }
                    }
                  >
                    {item.item_name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
