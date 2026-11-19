
"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Lang = "ko" | "en" | "ne" | "km" | "tl";
type Team = "vacuum" | "newmaterial";

type Notice = {
  id: number;
  team: Team;
  content_ko: string;
  content_en: string;
  content_ne: string;
  content_km: string;
  content_tl: string;
  important: boolean;
  created_at: string;
};

const languages: { code: Lang; label: string }[] = [
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
    login: "관리자 로그인",
    logout: "로그아웃",
    close: "닫기",
    email: "이메일",
    password: "비밀번호",
    add: "공지 등록",
    edit: "수정",
    delete: "삭제",
    save: "저장",
    cancel: "취소",
    important: "중요 공지",
    empty: "등록된 공지사항이 없습니다.",
    placeholder: "공지할 내용을 한국어로 입력하세요.",
    warning: "자동 번역 연결 전에는 외국어 화면에 한국어 원문이 표시됩니다.",
  },
  en: {
    title: "SERIM B&G Production Management",
    division: "Production Division",
    vacuum: "Vacuum Forming Team",
    newmaterial: "New Materials Production Team",
    notice: "Notices",
    admin: "Admin",
    login: "Admin Login",
    logout: "Logout",
    close: "Close",
    email: "Email",
    password: "Password",
    add: "Post Notice",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    important: "Important",
    empty: "No notices have been posted.",
    placeholder: "Enter the notice in Korean.",
    warning: "New notices are shown in Korean until automatic translation is connected.",
  },
  ne: {
    title: "सेरिम बी एन्ड जी उत्पादन व्यवस्थापन",
    division: "उत्पादन विभाग",
    vacuum: "भ्याकुम फर्मिङ टोली",
    newmaterial: "नयाँ सामग्री उत्पादन टोली",
    notice: "सूचनाहरू",
    admin: "प्रशासक",
    login: "प्रशासक लगइन",
    logout: "लगआउट",
    close: "बन्द",
    email: "इमेल",
    password: "पासवर्ड",
    add: "सूचना थप्नुहोस्",
    edit: "सम्पादन",
    delete: "मेटाउनुहोस्",
    save: "सुरक्षित गर्नुहोस्",
    cancel: "रद्द",
    important: "महत्त्वपूर्ण सूचना",
    empty: "कुनै सूचना छैन।",
    placeholder: "कोरियाली भाषामा सूचना लेख्नुहोस्।",
    warning: "स्वचालित अनुवाद उपलब्ध नभएसम्म नयाँ सूचना कोरियाली भाषामा देखिनेछ।",
  },
  km: {
    title: "ការគ្រប់គ្រងផលិតកម្ម SERIM B&G",
    division: "ផ្នែកផលិតកម្ម",
    vacuum: "ក្រុមបង្កើតទម្រង់ដោយសុញ្ញាកាស",
    newmaterial: "ក្រុមផលិតសម្ភារៈថ្មី",
    notice: "សេចក្តីជូនដំណឹង",
    admin: "អ្នកគ្រប់គ្រង",
    login: "ចូលគណនីអ្នកគ្រប់គ្រង",
    logout: "ចាកចេញ",
    close: "បិទ",
    email: "អ៊ីមែល",
    password: "ពាក្យសម្ងាត់",
    add: "បង្ហោះសេចក្តីជូនដំណឹង",
    edit: "កែប្រែ",
    delete: "លុប",
    save: "រក្សាទុក",
    cancel: "បោះបង់",
    important: "សេចក្តីជូនដំណឹងសំខាន់",
    empty: "មិនទាន់មានសេចក្តីជូនដំណឹងទេ។",
    placeholder: "សូមសរសេរសេចក្តីជូនដំណឹងជាភាសាកូរ៉េ។",
    warning: "សេចក្តីជូនដំណឹងថ្មីនឹងបង្ហាញជាភាសាកូរ៉េ រហូតដល់មានការបកប្រែដោយស្វ័យប្រវត្តិ។",
  },
  tl: {
    title: "SERIM B&G Pamamahala ng Produksyon",
    division: "Dibisyon ng Produksyon",
    vacuum: "Vacuum Forming Team",
    newmaterial: "New Materials Production Team",
    notice: "Mga Anunsyo",
    admin: "Admin",
    login: "Admin Login",
    logout: "Logout",
    close: "Isara",
    email: "Email",
    password: "Password",
    add: "Mag-post ng Anunsyo",
    edit: "I-edit",
    delete: "Burahin",
    save: "I-save",
    cancel: "Kanselahin",
    important: "Mahalagang Anunsyo",
    empty: "Wala pang mga anunsyo.",
    placeholder: "Isulat ang anunsyo sa Korean.",
    warning: "Ipapakita muna sa Korean ang mga bagong anunsyo hanggang maikonekta ang awtomatikong pagsasalin.",
  },
};

export default function Home() {
  const [lang, setLang] = useState<Lang>("ko");
  const [team, setTeam] = useState<Team>("newmaterial");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [divisionOpen, setDivisionOpen] = useState(true);
  const [openTeams, setOpenTeams] = useState<Record<Team, boolean>>({
    vacuum: true,
    newmaterial: true,
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inputText, setInputText] = useState("");
  const [important, setImportant] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const t = TEXT[lang];

  const loadNotices = useCallback(async () => {
    const { data, error } = await supabase
      .from("notices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("공지 조회 오류: " + error.message);
    } else {
      setNotices((data ?? []) as Notice[]);
    }
    setLoading(false);
  }, []);

  const checkAdmin = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setIsAdmin(false);
      return;
    }

    const { data, error } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    setIsAdmin(!error && !!data);
  }, []);

  useEffect(() => {
    void loadNotices();
    void checkAdmin();

    const { data: listener } = supabase.auth.onAuthStateChange(
      () => {
        void checkAdmin();
      }
    );

    const interval = window.setInterval(() => {
      void loadNotices();
    }, 15000);

    return () => {
      listener.subscription.unsubscribe();
      window.clearInterval(interval);
    };
  }, [loadNotices, checkAdmin]);

  const login = async () => {
    if (!email.trim() || !password) {
      setMessage("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    setBusy(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      setMessage("로그인 실패: 이메일 또는 비밀번호를 확인해 주세요.");
      setBusy(false);
      return;
    }

    const { data: admin, error: roleError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (roleError || !admin) {
      await supabase.auth.signOut();
      setIsAdmin(false);
      setMessage("관리자 권한이 없는 계정입니다.");
      setBusy(false);
      return;
    }

    setIsAdmin(true);
    setShowLogin(false);
    setPassword("");
    setMessage("관리자로 로그인했습니다.");
    setBusy(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setEditingId(null);
    setInputText("");
    setMessage("로그아웃했습니다.");
  };

  const resetForm = () => {
    setEditingId(null);
    setInputText("");
    setImportant(false);
  };

  const saveNotice = async () => {
    if (!isAdmin || !inputText.trim() || busy) return;

    setBusy(true);
    setMessage("");

    const content = inputText.trim();

    // 번역 연동 전에는 한국어 원문으로 저장
    const fields = {
      content_ko: content,
      content_en: content,
      content_ne: content,
      content_km: content,
      content_tl: content,
      important,
      updated_at: new Date().toISOString(),
    };

    const result = editingId !== null
      ? await supabase
          .from("notices")
          .update(fields)
          .eq("id", editingId)
          .select("id")
      : await supabase
          .from("notices")
          .insert({ ...fields, team })
          .select("id");

    if (result.error) {
      setMessage("저장 실패: " + result.error.message);
    } else if (!result.data?.length) {
      setMessage("저장 권한이 없거나 대상 공지를 찾을 수 없습니다.");
    } else {
      resetForm();
      setMessage("공지사항이 저장되었습니다.");
      await loadNotices();
    }

    setBusy(false);
  };

  const startEdit = (notice: Notice) => {
    setEditingId(notice.id);
    setInputText(notice.content_ko);
    setImportant(notice.important);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteNotice = async (id: number) => {
    if (!isAdmin || busy) return;

    if (!window.confirm("공지사항을 삭제하시겠습니까?")) {
      return;
    }

    setBusy(true);
    setMessage("");

    const { data, error } = await supabase
      .from("notices")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) {
      setMessage("삭제 실패: " + error.message);
    } else if (!data?.length) {
      setMessage("삭제 권한이 없거나 해당 공지가 없습니다.");
    } else {
      if (editingId === id) resetForm();
      setMessage("공지사항이 삭제되었습니다.");
      await loadNotices();
    }

    setBusy(false);
  };

  const selectTeam = (selected: Team) => {
    setTeam(selected);
    setMenuOpen(false);
    resetForm();
  };

  const teamNotices = notices.filter(
    (notice) => notice.team === team
  );

  const getContent = (notice: Notice) => {
    const key = `content_${lang}` as keyof Notice;
    return String(notice[key] || notice.content_ko);
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
          className="flex w-full justify-between rounded-lg px-3 py-3 text-left font-bold hover:bg-blue-800"
        >
          <span>▣ {t.division}</span>
          <span>{divisionOpen ? "▾" : "▸"}</span>
        </button>

        {divisionOpen && (
          <div className="mt-2 space-y-2 pl-2">
            {(["vacuum", "newmaterial"] as Team[]).map((item) => (
              <div key={item}>
                <button
                  onClick={() => setOpenTeams((prev) => ({
                    ...prev,
                    [item]: !prev[item],
                  }))}
                  className="flex w-full justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-blue-800"
                >
                  <span>{t[item]}</span>
                  <span>{openTeams[item] ? "▾" : "▸"}</span>
                </button>

                {openTeams[item] && (
                  <button
                    onClick={() => selectTeam(item)}
                    className={`ml-3 mt-1 w-[calc(100%-12px)] rounded-lg px-3 py-2 text-left text-sm ${
                      team === item
                        ? "bg-white font-bold text-blue-900"
                        : "bg-[#315B88] text-white hover:bg-blue-600"
                    }`}
                  >
                    • {t.notice}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {menuOpen && (
        <button
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transition-transform md:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </aside>

      <div className="min-h-screen md:ml-64">
        <header className="sticky top-0 z-30 bg-blue-700 p-4 text-white shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="rounded bg-blue-800 px-3 py-2 md:hidden"
              aria-label="Open menu"
            >
              ☰
            </button>

            <h1 className="flex-1 text-base font-bold sm:text-lg">
              {t.title}
            </h1>

            {isAdmin ? (
              <button
                onClick={logout}
                className="rounded bg-blue-900 px-3 py-2 text-xs"
              >
                {t.logout}
              </button>
            ) : (
              <button
                onClick={() => setShowLogin(!showLogin)}
                className="rounded bg-blue-900 px-3 py-2 text-xs"
              >
                {showLogin ? t.close : t.admin}
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => setLang(language.code)}
                className={`rounded px-2 py-2 text-xs font-semibold ${
                  lang === language.code
                    ? "bg-white text-blue-800"
                    : "bg-blue-600 text-blue-100"
                }`}
              >
                {language.label}
              </button>
            ))}
          </div>
        </header>

        <main className="mx-auto max-w-4xl p-4 sm:p-6">
          {message && (
            <div
              role="status"
              className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900"
            >
              {message}
            </div>
          )}

          {showLogin && !isAdmin && (
            <div className="mb-5 rounded-xl bg-white p-5 shadow">
              <h2 className="mb-3 font-bold">{t.login}</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                void login();
              }}>
                <input
                  type="email"
                  autoComplete="username"
                  placeholder={t.email}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mb-3 w-full rounded-lg border p-3"
                />
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder={t.password}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mb-3 w-full rounded-lg border p-3"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-lg bg-blue-700 px-5 py-3 text-white disabled:opacity-50"
                >
                  {t.login}
                </button>
              </form>
            </div>
          )}

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
            <div className="mb-5 rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 font-bold text-blue-800">
                {editingId !== null ? t.edit : t.add}
              </h3>

              <textarea
                rows={5}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t.placeholder}
                className="w-full rounded-lg border p-3 text-sm"
              />

              <label className="mt-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={important}
                  onChange={(e) => setImportant(e.target.checked)}
                />
                {t.important}
              </label>

              <p className="mt-3 text-xs text-orange-700">
                {t.warning}
              </p>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={saveNotice}
                  disabled={busy || !inputText.trim()}
                  className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  {editingId !== null ? t.save : t.add}
                </button>

                {editingId !== null && (
                  <button
                    onClick={resetForm}
                    className="rounded-lg border px-5 py-2.5 text-sm"
                  >
                    {t.cancel}
                  </button>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="rounded-xl bg-white p-8 text-center">
              공지사항 불러오는 중...
            </div>
          ) : teamNotices.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center text-gray-500">
              {t.empty}
            </div>
          ) : (
            <div className="space-y-4">
              {teamNotices.map((notice) => (
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
                      {new Date(notice.created_at).toLocaleDateString("ko-KR")}
                    </span>
                    {notice.important && (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-600">
                        IMPORTANT
                      </span>
                    )}
                  </div>

                  <p className="whitespace-pre-line text-sm leading-7 sm:text-base">
                    {getContent(notice)}
                  </p>

                  {isAdmin && (
                    <div className="mt-4 flex justify-end gap-2 border-t pt-3">
                      <button
                        onClick={() => startEdit(notice)}
                        className="rounded-lg border px-4 py-2 text-sm"
                      >
                        {t.edit}
                      </button>
                      <button
                        onClick={() => deleteNotice(notice.id)}
                        disabled={busy}
                        className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 disabled:opacity-50"
                      >
                        {t.delete}
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
