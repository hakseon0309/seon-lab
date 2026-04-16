import { createClient } from "@/lib/supabase/server";
import { getSeoulDateKey, isTradersHoliday } from "@/lib/time";
import {
  CafeteriaLocation,
  CafeteriaMenuItem,
} from "@/lib/types";

interface MealSection {
  mealType: "lunch" | "dinner" | "salad";
  label: string;
  timeRange: string;
  items: CafeteriaMenuItem[];
}

export default async function TodayMenu() {
  const supabase = await createClient();
  const { data: locations } = await supabase
    .from("cafeteria_locations")
    .select("id, name, lunch_start, lunch_end, dinner_start, dinner_end")
    .limit(1);

  if (!locations || locations.length === 0) return null;

  const location = locations[0] as CafeteriaLocation;
  const todayKey = getSeoulDateKey(new Date());

  const { data: menuData } = await supabase
    .from("cafeteria_menu_items")
    .select("id, location_id, date, meal_type, item_name, is_featured, sort_order")
    .eq("location_id", location.id)
    .eq("date", todayKey)
    .order("sort_order", { ascending: true });

  const items = (menuData || []) as CafeteriaMenuItem[];
  const formatTime = (t: string) => t.slice(0, 5); // "11:30:00" -> "11:30"
  const allSections: MealSection[] = [
    {
      mealType: "lunch" as const,
      label: "중식",
      timeRange: `${formatTime(location.lunch_start)}–${formatTime(location.lunch_end)}`,
      items: items.filter((i) => i.meal_type === "lunch"),
    },
    {
      mealType: "salad" as const,
      label: "샐러드",
      timeRange: `${formatTime(location.lunch_start)}–${formatTime(location.lunch_end)}`,
      items: items.filter((i) => i.meal_type === "salad"),
    },
    {
      mealType: "dinner" as const,
      label: "석식",
      timeRange: `${formatTime(location.dinner_start)}–${formatTime(location.dinner_end)}`,
      items: items.filter((i) => i.meal_type === "dinner"),
    },
  ];
  const meals = allSections.filter((section) => section.items.length > 0);

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
