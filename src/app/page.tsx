
"use client";

import React, { useState } from "react";

type Lang = "ko" | "en" | "ne" | "km" | "tl";
type Team = "vacuum" | "newmaterial";

type Notice = {
  id: number;
  team: Team;
  date: string;
  important: boolean;
  content: Record<Lang, string>;
};

const LANGUAGES: { code: Lang; label: string }[] = [
  { code: "ko", label: "🇰🇷 한국어" },
  { code: "en", label: "🇺🇸 English" },
  { code: "ne", label: "🇳🇵 नेपाली" },
  { code: "km", label: "🇰🇭 ខ្មែរ" },
  { code: "tl", label: "🇵🇭 Filipino" },
];

const TEXT = {
  ko: {
    title: "세림비앤지 생산관리",
    division: "생산본부",
    vacuum: "진공성형팀",
    newmaterial: "신소재생산팀",
    notice: "공지사항",
    admin: "관리자",
    close: "닫기",
    add: "공지 등록",
    submit: "공지 올리기",
    placeholder: "한국어로 공지사항을 입력하세요.",
    empty: "등록된 공지사항이 없습니다.",
    menu: "메뉴",
    warning: "새 공지는 임시 저장되며 자동 번역되지 않습니다.",
  },
  en: {
    title: "SERIM B&G Production Management",
    division: "Production Division",
    vacuum: "Vacuum Forming Team",
    newmaterial: "New Materials Production Team",
    notice: "Notices",
    admin: "Admin",
    close: "Close",
    add: "New Notice",
    submit: "Post Notice",
    placeholder: "Enter a notice in Korean.",
    empty: "No notices have been posted.",
    menu: "Menu",
    warning: "New notices are temporary and not automatically translated.",
  },
  ne: {
    title: "सेरिम बी एन्ड जी उत्पादन व्यवस्थापन",
    division: "उत्पादन विभाग",
    vacuum: "भ्याकुम फर्मिङ टोली",
    newmaterial: "नयाँ सामग्री उत्पादन टोली",
    notice: "सूचनाहरू",
    admin: "प्रशासक",
    close: "बन्द",
    add: "नयाँ सूचना",
    submit: "सूचना पोस्ट गर्नुहोस्",
    placeholder: "कोरियाली भाषामा सूचना लेख्नुहोस्।",
    empty: "कुनै सूचना छैन।",
    menu: "मेनु",
    warning: "नयाँ सूचनाहरू अस्थायी हुन् र स्वचालित रूपमा अनुवाद हुँदैनन्।",
  },
  km: {
    title: "ការគ្រប់គ្រងផលិតកម្ម SERIM B&G",
    division: "ផ្នែកផលិតកម្ម",
    vacuum: "ក្រុមបង្កើតទម្រង់ដោយសុញ្ញាកាស",
    newmaterial: "ក្រុមផលិតសម្ភារៈថ្មី",
    notice: "សេចក្តីជូនដំណឹង",
    admin: "អ្នកគ្រប់គ្រង",
    close: "បិទ",
    add: "ប្រកាសថ្មី",
    submit: "បង្ហោះសេចក្តីជូនដំណឹង",
    placeholder: "សូមបញ្ចូលសេចក្តីជូនដំណឹងជាភាសាកូរ៉េ។",
    empty: "មិនទាន់មានសេចក្តីជូនដំណឹងទេ។",
    menu: "ម៉ឺនុយ",
    warning: "សេចក្តីជូនដំណឹងថ្មីគឺបណ្តោះអាសន្ន និងមិនត្រូវបានបកប្រែដោយស្វ័យប្រវត្តិទេ។",
  },
  tl: {
    title: "SERIM B&G Pamamahala ng Produksyon",
    division: "Dibisyon ng Produksyon",
    vacuum: "Vacuum Forming Team",
    newmaterial: "New Materials Production Team",
    notice: "Mga Anunsyo",
    admin: "Admin",
    close: "Isara",
    add: "Bagong Anunsyo",
    submit: "I-post ang Anunsyo",
    placeholder: "Ilagay ang anunsyo sa wikang Korean.",
    empty: "Wala pang mga anunsyo.",
    menu: "Menu",
    warning: "Pansamantala lamang ang mga bagong anunsyo at hindi awtomatikong isinasalin.",
  },
};

const INITIAL_NOTICES: Notice[] = [
  {
    id: 1,
    team: "newmaterial",
    date: "2026-11-19",
    important: true,
    content: {
      ko: "[★] 세림비앤지 생산본부 어플리케이션 실사용 테스트 중입니다. -최준혁 사원-",
      en: "[★] The SERIM B&G Production Division application is currently undergoing real-world testing. - Employee Choi Jun-hyeok -",
      ne: "[★] सेरिम बी एन्ड जी उत्पादन विभागको एप्लिकेसन हाल वास्तविक प्रयोगको परीक्षणमा छ। - कर्मचारी चोई जुन-ह्योक -",
      km: "[★] កម្មវិធីរបស់ផ្នែកផលិតកម្ម SERIM B&G កំពុងស្ថិតក្នុងការសាកល្បងប្រើប្រាស់ជាក់ស្តែង។ - បុគ្គលិក Choi Jun-hyeok -",
      tl: "[★] Kasalukuyang sinusubukan sa aktuwal na paggamit ang aplikasyon ng Dibisyon ng Produksyon ng SERIM B&G. - Empleyadong Choi Jun-hyeok -",
    },
  },
  {
    id: 2,
    team: "newmaterial",
    date: "2026-11-19",
    important: false,
    content: {
      ko: "[공지사항] 금일 10:00시 [마니커 거래업체]에서 방문할 예정이오니, 작업자분들은 복장검토 및 2중 위생모, 마스크를 착용해주시길 바랍니다.",
      en: "[NOTICE] A representative from Maniker, our business partner, is scheduled to visit today at 10:00 AM. All workers are requested to check their work attire and wear double hairnets and a face mask.",
      ne: "[सूचना] आज बिहान १०:०० बजे हाम्रो व्यापारिक साझेदार मानिकेर (Maniker) का प्रतिनिधि भ्रमणमा आउने कार्यक्रम छ। सबै कामदारहरूले आफ्नो काम गर्ने पोसाक जाँच गरी दुई तहको हेयरनेट र मास्क लगाउनुहोस्।",
      km: "[សេចក្តីជូនដំណឹង] តំណាងក្រុមហ៊ុនដៃគូពាណិជ្ជកម្ម Maniker គ្រោងនឹងមកទស្សនកិច្ចនៅថ្ងៃនេះ វេលាម៉ោង ១០:០០ ព្រឹក។ សូមកម្មករទាំងអស់ពិនិត្យសម្លៀកបំពាក់ការងារ និងពាក់មួកគ្របសក់អនាម័យពីរជាន់ ព្រមទាំងម៉ាស់។",
      tl: "[PAUNAWA] Nakatakdang bumisita ngayong araw sa ganap na 10:00 AM ang kinatawan ng ating kasosyong kumpanya na Maniker. Hinihiling sa lahat ng manggagawa na suriin ang kanilang kasuotan sa trabaho at magsuot ng dalawang patong ng hairnet at face mask.",
    },
  },
];

export default function Home() {
  const [lang, setLang] = useState<Lang>("ko");
  const [team, setTeam] = useState<Team>("newmaterial");
  const [notices, setNotices] =
    useState<Notice[]>(INITIAL_NOTICES);
  const [inputText, setInputText] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [divisionOpen, setDivisionOpen] = useState(true);
  const [openTeams, setOpenTeams] = useState<Record<Team, boolean>>({
    vacuum: true,
    newmaterial: true,
  });

  const t = TEXT[lang];

  const teamNotices = notices.filter(
    (notice) => notice.team === team
  );

  const selectTeam = (selectedTeam: Team) => {
    setTeam(selectedTeam);
    setIsAdmin(false);
    setMenuOpen(false);
  };

  const handleAddNotice = () => {
    if (!inputText.trim()) return;

    const today = new Date();
    const date = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    const newEntry: Notice = {
      id: Date.now(),
      team,
      date,
      important: true,
      content: {
        ko: inputText,
        en: `[Translation pending] ${inputText}`,
        ne: `[अनुवाद बाँकी छ] ${inputText}`,
        km: `[កំពុងរង់ចាំការបកប្រែ] ${inputText}`,
        tl: `[Naghihintay ng pagsasalin] ${inputText}`,
      },
    };

    setNotices((prev) => [newEntry, ...prev]);
    setInputText("");
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-[#15365B] text-white">
      <div className="border-b border-blue-800 p-5">
        <div className="text-lg font-bold">SERIM B&G</div>
        <div className="mt-1 text-xs text-blue-200">
          Production Management
        </div>
      </div>

      <nav className="flex-1 p-3">
        <button
          onClick={() => setDivisionOpen(!divisionOpen)}
          className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left font-bold hover:bg-blue-800"
        >
          <span>▣ {t.division}</span>
          <span>{divisionOpen ? "▾" : "▸"}</span>
        </button>

        {divisionOpen && (
          <div className="mt-2 space-y-2 pl-2">
            {(["vacuum", "newmaterial"] as Team[]).map(
              (item) => (
                <div key={item}>
                  <button
                    onClick={() =>
                      setOpenTeams((prev) => ({
                        ...prev,
                        [item]: !prev[item],
                      }))
                    }
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-blue-800"
                  >
                    <span>{t[item]}</span>
                    <span>{openTeams[item] ? "▾" : "▸"}</span>
                  </button>

                  {openTeams[item] && (
                    <button
                      onClick={() => selectTeam(item)}
                      className={`ml-3 mt-1 w-[calc(100%-12px)] rounded-lg px-3 py-2 text-left text-sm transition ${
                        team === item
                          ? "bg-white font-bold text-blue-900"
                          : "bg-[#315B88] text-white hover:bg-blue-600"
                      }`}
                    >
                      • {t.notice}
                    </button>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </nav>

      <div className="border-t border-blue-800 p-4 text-xs text-blue-200">
        © SERIM B&G
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 md:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </aside>

      <div className="min-h-screen md:ml-64">
        <header className="sticky top-0 z-30 bg-blue-700 p-4 text-white shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg bg-blue-800 px-3 py-2 md:hidden"
              aria-label={t.menu}
            >
              ☰
            </button>

            <h1 className="flex-1 text-base font-bold sm:text-lg">
              {t.title}
            </h1>

            <button
              onClick={() => setIsAdmin(!isAdmin)}
              className="shrink-0 rounded bg-blue-900 px-3 py-2 text-xs"
            >
              {isAdmin ? t.close : t.admin}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {LANGUAGES.map((language) => (
              <button
                key={language.code}
                onClick={() => setLang(language.code)}
                className={`rounded px-2 py-2 text-xs font-semibold transition ${
                  lang === language.code
                    ? "bg-white text-blue-800 shadow"
                    : "bg-blue-600 text-blue-100 hover:bg-blue-500"
                }`}
              >
                {language.label}
              </button>
            ))}
          </div>
        </header>

        <main className="mx-auto max-w-4xl p-4 sm:p-6">
          <div className="mb-4 text-sm text-gray-500">
            {t.division} / {t[team]} / {t.notice}
          </div>

          <div className="mb-5 rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-blue-900">
              {t[team]}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t.notice}
            </p>
          </div>

          {isAdmin && (
            <div className="mb-5 rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 font-bold text-blue-800">
                {t.add} - {t[team]}
              </h3>

              <textarea
                rows={4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t.placeholder}
                className="w-full rounded-lg border p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />

              <p className="mt-2 text-xs text-orange-700">
                {t.warning}
              </p>

              <button
                onClick={handleAddNotice}
                className="mt-3 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
              >
                {t.submit}
              </button>
            </div>
          )}

          <div className="space-y-4">
            {teamNotices.length === 0 ? (
              <div className="rounded-xl bg-white p-10 text-center text-gray-500 shadow-sm">
                {t.empty}
              </div>
            ) : (
              teamNotices.map((notice) => (
                <article
                  key={notice.id}
                  className={`rounded-xl border-l-4 bg-white p-5 shadow-sm ${
                    notice.important
                      ? "border-red-500"
                      : "border-blue-500"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {notice.date}
                    </span>

                    {notice.important && (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-600">
                        IMPORTANT
                      </span>
                    )}
                  </div>

                  <p className="whitespace-pre-line text-sm leading-7 text-gray-800 sm:text-base">
                    {notice.content[lang]}
                  </p>
                </article>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
