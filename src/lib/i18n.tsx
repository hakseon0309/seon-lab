"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Locale = "ko" | "en";

// 모든 사용자 노출 문구는 이 파일 하나에서 관리한다.
// 언어 추가/수정 시 아래 dictionaries만 바꾸면 된다.
const dictionaries = {
  ko: {
    brand: "SEON LAB",
    tagline: "팀 근무 일정 공유 서비스",
    subTagline: "캘린더 구독 URL 기반",
    googleSignIn: "Google로 시작하기",
    navCalendar: "달력",
    navTeams: "팀",
    navSettings: "설정",
    myShift: "내 근무",
    lastSynced: "마지막 동기화",
    settings: "설정",
    name: "이름",
    namePlaceholder: "팀에서 보일 이름",
    icsUrl: "캘린더 구독 URL",
    save: "저장",
    saving: "저장 중...",
    themeDark: "다크 모드",
    themeLight: "라이트 모드",
    themeToggle: "테마 전환",
    logout: "로그아웃",
    coupleConnect: "커플 연결",
    couplePartner: "상대방",
    sync: "새로고침",
    syncing: "동기화 중...",
    remainingMinutes: (n: number) => `${n}분 후 가능`,
    teams: "팀",
    admin: "관리자",
  },
  en: {
    brand: "SEON LAB",
    tagline: "Team work schedule sharing service",
    subTagline: "Calendar subscription URL based",
    googleSignIn: "Continue with Google",
    navCalendar: "Calendar",
    navTeams: "Teams",
    navSettings: "Settings",
    myShift: "My work",
    lastSynced: "Last synced",
    settings: "Settings",
    name: "Name",
    namePlaceholder: "Display name",
    icsUrl: "Calendar URL",
    save: "Save",
    saving: "Saving...",
    themeDark: "Dark mode",
    themeLight: "Light mode",
    themeToggle: "Toggle theme",
    logout: "Log out",
    coupleConnect: "Couple link",
    couplePartner: "Partner",
    sync: "Refresh",
    syncing: "Syncing...",
    remainingMinutes: (n: number) => `${n}m left`,
    teams: "Teams",
    admin: "Admin",
  },
};

type Dict = typeof dictionaries.ko;

const I18nContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dict;
} | null>(null);

const STORAGE_KEY = "seon-lab-locale";

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "ko";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "en" ? "en" : "ko";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  function setLocale(l: Locale) {
    setLocaleState(l);
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: dictionaries[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
