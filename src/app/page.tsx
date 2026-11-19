
"use client";

import React, { useState } from "react";

type Lang = "ko" | "en" | "ne" | "km" | "tl";

type Notice = {
  id: number;
  date: string;
  important: boolean;
  content: Record<Lang, string>;
};

const UI_TEXT: Record<
  Lang,
  {
    title: string;
    newNotice: string;
    placeholder: string;
    submit: string;
    close: string;
    admin: string;
  }
> = {
  ko: {
    title: "세림비앤지 생산관리",
    newNotice: "공지 등록 (관리자용)",
    placeholder: "공지할 내용을 한국어로 입력하세요...",
    submit: "공지 올리기",
    close: "닫기",
    admin: "관리자",
  },
  en: {
    title: "SERIM B&G Production Management",
    newNotice: "Post Notice (Admin)",
    placeholder: "Enter notice in Korean...",
    submit: "Post Notice",
    close: "Close",
    admin: "Admin",
  },
  ne: {
    title: "सेरिम बी एन्ड जी उत्पादन व्यवस्थापन",
    newNotice: "सूचना दर्ता (प्रशासक)",
    placeholder: "कोरियाली भाषामा सूचना लेख्नुहोस्...",
    submit: "सूचना पोस्ट गर्नुहोस्",
    close: "बन्द गर्नुहोस्",
    admin: "प्रशासक",
  },
  km: {
    title: "ការគ្រប់គ្រងផលិតកម្ម SERIM B&G",
    newNotice: "ប្រកាសព័ត៌មាន (អ្នកគ្រប់គ្រង)",
    placeholder: "សូមបញ្ចូលសេចក្តីជូនដំណឹងជាភាសាកូរ៉េ...",
    submit: "បង្ហោះសេចក្តីជូនដំណឹង",
    close: "បិទ",
    admin: "អ្នកគ្រប់គ្រង",
  },
  tl: {
    title: "SERIM B&G Pamamahala ng Produksyon",
    newNotice: "Mag-post ng Anunsyo (Admin)",
    placeholder: "Ilagay ang anunsyo sa wikang Korean...",
    submit: "I-post ang Anunsyo",
    close: "Isara",
    admin: "Admin",
  },
};

const LANGUAGES: { code: Lang; label: string }[] = [
  { code: "ko", label: "🇰🇷 한국어" },
  { code: "en", label: "🇺🇸 English" },
  { code: "ne", label: "🇳🇵 नेपाली" },
  { code: "km", label: "🇰🇭 ខ្មែរ" },
  { code: "tl", label: "🇵🇭 Filipino" },
];

const INITIAL_NOTICES: Notice[] = [
  {
    id: 1,
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
  const [notices, setNotices] =
    useState<Notice[]>(INITIAL_NOTICES);
  const [inputText, setInputText] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const handleAddNotice = () => {
    if (!inputText.trim()) return;

    const newEntry: Notice = {
      id: Date.now(),
      date: new Date().toLocaleDateString("sv-SE"),
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

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 pb-10">
      <header className="bg-blue-700 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-3 gap-2">
            <h1 className="text-lg font-bold">
              {UI_TEXT[lang].title}
            </h1>

            <button
              onClick={() => setIsAdmin(!isAdmin)}
              className="shrink-0 text-xs bg-blue-900 px-2.5 py-1 rounded hover:bg-blue-800"
            >
              {isAdmin
                ? UI_TEXT[lang].close
                : UI_TEXT[lang].admin}
            </button>
          </div>

          <div className="grid grid-cols-5 gap-1">
            {LANGUAGES.map((language) => (
              <button
                key={language.code}
                onClick={() => setLang(language.code)}
                className={`min-w-0 py-2 px-0.5 rounded text-[10px] font-semibold transition ${
                  lang === language.code
                    ? "bg-white text-blue-800 shadow"
                    : "bg-blue-600 text-blue-100 hover:bg-blue-500"
                }`}
              >
                {language.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {isAdmin && (
          <div className="bg-white p-4 rounded-xl shadow border border-blue-200">
            <h2 className="text-sm font-bold text-blue-800 mb-2">
              {UI_TEXT[lang].newNotice}
            </h2>

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

        <div className="space-y-3">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${
                notice.important
                  ? "border-red-500"
                  : "border-blue-500"
              }`}
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-400">
                  {notice.date}
                </span>

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
