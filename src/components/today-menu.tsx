"use client";

import { createClient } from "@/lib/supabase/client";
import { getSeoulDateKey } from "@/lib/time";
import {
  CafeteriaLocation,
  CafeteriaMenuItem,
  CafeteriaMealScore,
} from "@/lib/types";
import { useEffect, useState } from "react";

interface MealSection {
  mealType: "lunch" | "dinner" | "salad";
  label: string;
  timeRange: string;
  items: CafeteriaMenuItem[];
  score: CafeteriaMealScore | null;
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

      // 3. 오늘 메뉴 + 점수 병렬 조회
      const [menuRes, scoreRes] = await Promise.all([
        supabase
          .from("cafeteria_menu_items")
          .select("*")
          .eq("location_id", loc.id)
          .eq("date", todayKey)
          .order("sort_order", { ascending: true }),
        supabase
          .from("cafeteria_meal_scores")
          .select("*")
          .eq("location_id", loc.id)
          .eq("date", todayKey),
      ]);

      const items = (menuRes.data || []) as CafeteriaMenuItem[];
      const scores = (scoreRes.data || []) as CafeteriaMealScore[];

      // 4. 끼니별 그룹핑
      const formatTime = (t: string) => t.slice(0, 5); // "11:30:00" -> "11:30"
      const allSections: MealSection[] = [
        {
          mealType: "lunch" as const,
          label: "중식",
          timeRange: `${formatTime(loc.lunch_start)}–${formatTime(loc.lunch_end)}`,
          items: items.filter((i) => i.meal_type === "lunch"),
          score: scores.find((s) => s.meal_type === "lunch") || null,
        },
        {
          mealType: "salad" as const,
          label: "샐러드",
          timeRange: `${formatTime(loc.lunch_start)}–${formatTime(loc.lunch_end)}`,
          items: items.filter((i) => i.meal_type === "salad"),
          score: scores.find((s) => s.meal_type === "salad") || null,
        },
        {
          mealType: "dinner" as const,
          label: "석식",
          timeRange: `${formatTime(loc.dinner_start)}–${formatTime(loc.dinner_end)}`,
          items: items.filter((i) => i.meal_type === "dinner"),
          score: scores.find((s) => s.meal_type === "dinner") || null,
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
  if (!location || meals.length === 0) return null;

  const todayLabel = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date());

  return (
    <div className="mt-4 px-4 lg:px-0">
      <div className="mb-3 flex items-baseline justify-between">
        <h2
          className="text-base font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          오늘의 직원 식당
        </h2>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {location.name} · {todayLabel}
        </span>
      </div>

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
            {/* 헤더: 끼니 이름 + 시간 + 점수 */}
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {meal.label}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {meal.timeRange}
                </span>
              </div>
              {meal.score && (
                <div className="flex items-center gap-1">
                  <ScoreDisplay score={meal.score.score} />
                </div>
              )}
            </div>

            {/* 메뉴 목록 */}
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

            {/* 코멘트 */}
            {meal.score?.comment && (
              <p
                className="mt-2 text-xs leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                {meal.score.comment}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreDisplay({ score }: { score: number }) {
  const filled = Math.floor(score);
  const half = score - filled >= 0.5;
  const empty = 5 - filled - (half ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      <div className="flex">
        {Array.from({ length: filled }).map((_, i) => (
          <span
            key={`f-${i}`}
            className="text-xs"
            style={{ color: "var(--event-text)" }}
          >
            ●
          </span>
        ))}
        {half && (
          <span
            className="text-xs"
            style={{ color: "var(--event-text)" }}
          >
            ◐
          </span>
        )}
        {Array.from({ length: empty }).map((_, i) => (
          <span
            key={`e-${i}`}
            className="text-xs"
            style={{ color: "var(--border)" }}
          >
            ●
          </span>
        ))}
      </div>
      <span
        className="text-xs font-semibold tabular-nums"
        style={{ color: "var(--text-secondary)" }}
      >
        {score.toFixed(1)}
      </span>
    </div>
  );
}
