"use client";

import React, { useState } from "react";

// 언어별 UI 텍스트 설정
const UI_TEXT = {
  ko: { title: "세림비앤지 현장 공지사항", newNotice: "공지 등록 (관리자용)", placeholder: "공지할 내용을 한국어로 입력하세요...", submit: "공지 올리기", langName: "한국어" },
  en: { title: "Serim B&G Factory Notice", newNotice: "Post Notice (Admin)", placeholder: "Enter notice in Korean...", submit: "Post", langName: "English (PH)" },
  ne: { title: "सेरिम बी एण्ड जी सूचना (नेपाली)", newNotice: "सूचना पोस्ट गर्नुहोस्", placeholder: "कोरियाली भाषामा सूचना लेख्नुहोस्...", submit: "पोस्ट", langName: "नेपाली (Nepal)" },
  km: { title: "សេចក្តីជូនដំណឹង Serim B&G", newNotice: "បង្ហោះសេចក្តីជូនដំណឹង", placeholder: "បញ្ចូលសេចក្តីជូនដំណឹងជាភាសាកូរ៉េ...", submit: "បង្ហោះ", langName: "ភាសាខ្មែរ (Cambodia)" },
};

// 샘플 공지 데이터
const INITIAL_NOTICES = [
  {
    id: 1,
    date: "2026-11-19",
    important: true,
    content: {
      ko: "[★] 세림비앤지 생산본부 어플리케이션 실사용 테스트 중입니다. -최준혁 사원-",
      en: "[Must Read] Safety inspection for Production Line 1 tomorrow at 9:00 AM. Please wear your safety helmet.",
      ne: "[अति जरुरी] भोलि बिहान ९:०० बजे उत्पादन लाइन १ को सुरक्षा जाँच छ। कृपया अनिवार्य रूपमा सुरक्षा हेलमेट लगाउनुहोस्।",
      km: "[សំខាន់] ថ្ងៃស្អែកម៉ោង ៩:០០ ព្រឹក មានការត្រួតពិនិត្យសុវត្ថិភាពនៅខ្សែសង្វាក់ផលិតកម្មទី ១។ សូមពាក់មួកសុវត្ថិភាពជាដាច់ខាត។",
    },
  },
  {
    id: 2,
    date: "2026-11-19",
    important: false,
    content: {
      ko: "[공지사항] 금일 10:00시 [마니커 거래업체]에서 방문할 예정이오니, 작업자분들은 복장검토 및 2중 위생모, 마스크를 착용해주시길 바랍니다.",
      en: "This Friday's lunch break will start at 12:30 PM due to floor maintenance.",
      ne: "यो शुक्रबार मर्मतसम्भारका कारण दिउँसोको खानाको समय १२:३० बजेबाट सुरु हुनेछ।",
      km: "ថ្ងៃសុក្រនេះ ម៉ោងសម្រាកអាហារថ្ងៃត្រង់នឹងចាប់ផ្តើមនៅម៉ោង ១២:៣០ ថ្ងៃត្រង់ ដោយសារការជួសជុលរោងចក្រ។",
    },
  },
];

type Lang = "ko" | "en" | "ne" | "km";

export default function Home() {
  const [lang, setLang] = useState<Lang>("ko");
  const [notices, setNotices] = useState(INITIAL_NOTICES);
  const [inputText, setInputText] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const handleAddNotice = () => {
    if (!inputText.trim()) return;
    const newEntry = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      important: true,
      content: {
        ko: inputText,
        en: `[EN 번역예정] ${inputText}`,
        ne: `[NE 번역예정] ${inputText}`,
        km: `[KM 번역예정] ${inputText}`,
      },
    };
    setNotices([newEntry, ...notices]);
    setInputText("");
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 pb-10">
      {/* 상단 헤더 & 언어 선택 바 */}
      <header className="bg-blue-700 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-lg font-bold">{UI_TEXT[lang].title}</h1>
            <button
              onClick={() => setIsAdmin(!isAdmin)}
              className="text-xs bg-blue-900 px-2.5 py-1 rounded hover:bg-blue-800"
            >
              {isAdmin ? "닫기" : "관리자"}
            </button>
          </div>

          {/* 국기 / 언어 전환 버튼 */}
          <div className="grid grid-cols-4 gap-1.5">
            {(["ko", "en", "ne", "km"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`py-2 px-1 rounded text-xs font-semibold transition ${
                  lang === l
                    ? "bg-white text-blue-800 shadow"
                    : "bg-blue-600 text-blue-100 hover:bg-blue-500"
                }`}
              >
                {l === "ko" && "🇰🇷 한국어"}
                {l === "en" && "🇵🇭 English"}
                {l === "ne" && "🇳🇵 नेपाली"}
                {l === "km" && "🇰🇭 ខ្មែរ"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* 관리자 공지 입력창 */}
        {isAdmin && (
          <div className="bg-white p-4 rounded-xl shadow border border-blue-200">
            <h2 className="text-sm font-bold text-blue-800 mb-2">{UI_TEXT[lang].newNotice}</h2>
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={UI_TEXT[lang].placeholder}
              className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddNotice}
              className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700"
            >
              {UI_TEXT[lang].submit}
            </button>
          </div>
        )}

        {/* 공지사항 리스트 */}
        <div className="space-y-3">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${
                notice.important ? "border-red-500" : "border-blue-500"
              }`}
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-400">{notice.date}</span>
                {notice.important && (
                  <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
                    IMPORTANT
                  </span>
                )}
              </div>
              <p className="text-base leading-relaxed font-medium text-gray-800 whitespace-pre-line">
                {notice.content[lang]}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
