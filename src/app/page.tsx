
"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import AttendanceManager from "./AttendanceManager";
import ShiftRoster from "./ShiftRoster";

type Lang = "ko" | "en" | "ne" | "km" | "tl" | "vi";
type Team = "vacuum" | "newmaterial";
type Page = "dashboard" | "calendar" | "notice" | "attendance" | "shift";

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

const LANGUAGES: { code: Lang; label: string }[] = [
  { code: "ko", label: "🇰🇷 한국어" },
  { code: "en", label: "🇺🇸 English" },
  { code: "ne", label: "🇳🇵 नेपाली" },
  { code: "km", label: "🇰🇭 ខ្មែរ" },
  { code: "tl", label: "🇵🇭 Filipino" },
  { code: "vi", label: "🇻🇳 Tiếng Việt" },
];

const UI = {
  ko: {
    title: "세림비앤지 생산관리",
    dashboard: "대시보드",
    calendar: "통합 캘린더",
    division: "생산본부",
    vacuum: "진공성형팀",
    newmaterial: "신소재생산팀",
    notice: "공지사항",
    attendance: "출석체크",
    shift: "주/야 교대명단",
    admin: "관리자",
    login: "관리자 로그인",
    logout: "로그아웃",
    email: "이메일",
    password: "비밀번호",
    add: "공지 등록",
    edit: "수정",
    delete: "삭제",
    save: "저장",
    cancel: "취소",
    important: "중요 공지",
    empty: "등록된 공지사항이 없습니다.",
    latest: "최근 공지사항",
    all: "전체 보기",
    placeholder: "한국어로 공지사항을 입력하세요.",
    ready: "준비 중인 기능입니다.",
    attendanceInfo: "팀별 출근, 결근, 휴가 현황을 관리할 예정입니다.",
    shiftInfo: "주간 및 야간 근무자 명단을 관리할 예정입니다.",
    calendarInfo: "생산일정, 교육, 설비점검 등의 일정을 관리할 예정입니다.",
    translationInfo: "자동 번역 연결 전에는 새 공지가 한국어 원문으로 표시됩니다.",
    noEvents: "아직 등록된 일정이 없습니다.",
    noticeCount: "등록된 공지",
    teamCount: "운영 팀",
    languageCount: "지원 언어",
    welcome: "안전하고 효율적인 생산 현장을 함께 만들어갑니다.",
    loading: "공지사항을 불러오는 중...",
  },
  en: {
    title: "SERIM B&G Production Management",
    dashboard: "Dashboard",
    calendar: "Calendar",
    division: "Production Division",
    vacuum: "Vacuum Forming Team",
    newmaterial: "New Materials Production Team",
    notice: "Notices",
    attendance: "Attendance",
    shift: "Day/Night Shift Roster",
    admin: "Admin",
    login: "Admin Login",
    logout: "Logout",
    email: "Email",
    password: "Password",
    add: "Post Notice",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    important: "Important",
    empty: "No notices have been posted.",
    latest: "Recent Notices",
    all: "View All",
    placeholder: "Enter the notice in Korean.",
    ready: "This feature is under development.",
    attendanceInfo: "Attendance and leave records will be available here.",
    shiftInfo: "Day and night shift rosters will be available here.",
    calendarInfo: "Production schedules, training and inspections will be managed here.",
    translationInfo: "New notices are shown in Korean until automatic translation is connected.",
    noEvents: "No events have been registered.",
    noticeCount: "Notices",
    teamCount: "Teams",
    languageCount: "Languages",
    welcome: "Building a safe and efficient workplace together.",
    loading: "Loading notices...",
  },
  ne: {
    title: "सेरिम बी एन्ड जी उत्पादन व्यवस्थापन",
    dashboard: "ड्यासबोर्ड",
    calendar: "पात्रो",
    division: "उत्पादन विभाग",
    vacuum: "भ्याकुम फर्मिङ टोली",
    newmaterial: "नयाँ सामग्री उत्पादन टोली",
    notice: "सूचनाहरू",
    attendance: "उपस्थिति",
    shift: "दिन/रात सिफ्ट सूची",
    admin: "प्रशासक",
    login: "प्रशासक लगइन",
    logout: "लगआउट",
    email: "इमेल",
    password: "पासवर्ड",
    add: "सूचना थप्नुहोस्",
    edit: "सम्पादन",
    delete: "मेटाउनुहोस्",
    save: "सुरक्षित गर्नुहोस्",
    cancel: "रद्द",
    important: "महत्त्वपूर्ण",
    empty: "कुनै सूचना छैन।",
    latest: "हालका सूचनाहरू",
    all: "सबै हेर्नुहोस्",
    placeholder: "कोरियाली भाषामा सूचना लेख्नुहोस्।",
    ready: "यो सुविधा विकास भइरहेको छ।",
    attendanceInfo: "उपस्थिति र बिदाको विवरण यहाँ उपलब्ध हुनेछ।",
    shiftInfo: "दिन र रातको सिफ्ट सूची यहाँ उपलब्ध हुनेछ।",
    calendarInfo: "उत्पादन तालिका र निरीक्षणको विवरण यहाँ उपलब्ध हुनेछ।",
    translationInfo: "स्वचालित अनुवाद नजोडिएसम्म नयाँ सूचना कोरियाली भाषामा देखिनेछ।",
    noEvents: "कुनै कार्यक्रम छैन।",
    noticeCount: "सूचनाहरू",
    teamCount: "टोली",
    languageCount: "भाषाहरू",
    welcome: "सुरक्षित र प्रभावकारी कार्यस्थल बनाऔँ।",
    loading: "सूचनाहरू लोड हुँदैछन्...",
  },
  km: {
    title: "ការគ្រប់គ្រងផលិតកម្ម SERIM B&G",
    dashboard: "ផ្ទាំងគ្រប់គ្រង",
    calendar: "ប្រតិទិន",
    division: "ផ្នែកផលិតកម្ម",
    vacuum: "ក្រុមបង្កើតទម្រង់ដោយសុញ្ញាកាស",
    newmaterial: "ក្រុមផលិតសម្ភារៈថ្មី",
    notice: "សេចក្តីជូនដំណឹង",
    attendance: "វត្តមាន",
    shift: "បញ្ជីវេនថ្ងៃ/យប់",
    admin: "អ្នកគ្រប់គ្រង",
    login: "ចូលគណនីអ្នកគ្រប់គ្រង",
    logout: "ចាកចេញ",
    email: "អ៊ីមែល",
    password: "ពាក្យសម្ងាត់",
    add: "បង្ហោះសេចក្តីជូនដំណឹង",
    edit: "កែប្រែ",
    delete: "លុប",
    save: "រក្សាទុក",
    cancel: "បោះបង់",
    important: "សំខាន់",
    empty: "មិនទាន់មានសេចក្តីជូនដំណឹងទេ។",
    latest: "សេចក្តីជូនដំណឹងថ្មីៗ",
    all: "មើលទាំងអស់",
    placeholder: "សូមសរសេរសេចក្តីជូនដំណឹងជាភាសាកូរ៉េ។",
    ready: "មុខងារនេះកំពុងអភិវឌ្ឍ។",
    attendanceInfo: "ព័ត៌មានវត្តមាន និងការឈប់សម្រាកនឹងមាននៅទីនេះ។",
    shiftInfo: "បញ្ជីវេនថ្ងៃ និងយប់នឹងមាននៅទីនេះ។",
    calendarInfo: "កាលវិភាគផលិតកម្ម និងការត្រួតពិនិត្យនឹងមាននៅទីនេះ។",
    translationInfo: "សេចក្តីជូនដំណឹងថ្មីនឹងបង្ហាញជាភាសាកូរ៉េ រហូតដល់ភ្ជាប់ការបកប្រែស្វ័យប្រវត្តិ។",
    noEvents: "មិនទាន់មានកម្មវិធីទេ។",
    noticeCount: "សេចក្តីជូនដំណឹង",
    teamCount: "ក្រុម",
    languageCount: "ភាសា",
    welcome: "រួមគ្នាបង្កើតកន្លែងការងារដែលមានសុវត្ថិភាព។",
    loading: "កំពុងទាញយកសេចក្តីជូនដំណឹង...",
  },
  tl: {
    title: "SERIM B&G Pamamahala ng Produksyon",
    dashboard: "Dashboard",
    calendar: "Kalendaryo",
    division: "Dibisyon ng Produksyon",
    vacuum: "Vacuum Forming Team",
    newmaterial: "New Materials Production Team",
    notice: "Mga Anunsyo",
    attendance: "Attendance",
    shift: "Listahan ng Day/Night Shift",
    admin: "Admin",
    login: "Admin Login",
    logout: "Logout",
    email: "Email",
    password: "Password",
    add: "Mag-post ng Anunsyo",
    edit: "I-edit",
    delete: "Burahin",
    save: "I-save",
    cancel: "Kanselahin",
    important: "Mahalaga",
    empty: "Wala pang mga anunsyo.",
    latest: "Mga Bagong Anunsyo",
    all: "Tingnan Lahat",
    placeholder: "Isulat ang anunsyo sa Korean.",
    ready: "Ginagawa pa ang tampok na ito.",
    attendanceInfo: "Dito makikita ang attendance at leave records.",
    shiftInfo: "Dito makikita ang mga listahan ng day at night shift.",
    calendarInfo: "Dito pamamahalaan ang mga iskedyul at inspeksiyon.",
    translationInfo: "Ipapakita muna sa Korean ang mga bagong anunsyo hanggang maikonekta ang awtomatikong pagsasalin.",
    noEvents: "Wala pang nakatalang iskedyul.",
    noticeCount: "Anunsyo",
    teamCount: "Mga Team",
    languageCount: "Mga Wika",
    welcome: "Sama-sama para sa ligtas at maayos na trabaho.",
    loading: "Kinukuha ang mga anunsyo...",
  },
vi: {
  title: "Quản lý sản xuất SERIM B&G",
  dashboard: "Bảng điều khiển",
  calendar: "Lịch tổng hợp",
  division: "Bộ phận sản xuất",
  vacuum: "Đội tạo hình chân không",
  newmaterial: "Đội sản xuất vật liệu mới",
  notice: "Thông báo",
  attendance: "Chấm công",
  shift: "Danh sách ca ngày/đêm",
  admin: "Quản trị viên",
  login: "Đăng nhập quản trị",
  logout: "Đăng xuất",
  email: "Email",
  password: "Mật khẩu",
  add: "Đăng thông báo",
  edit: "Chỉnh sửa",
  delete: "Xóa",
  save: "Lưu",
  cancel: "Hủy",
  important: "Thông báo quan trọng",
  empty: "Chưa có thông báo nào.",
  latest: "Thông báo mới nhất",
  all: "Xem tất cả",
  placeholder: "Nhập nội dung thông báo bằng tiếng Hàn.",
  ready: "Chức năng đang được phát triển.",
  attendanceInfo: "Quản lý chấm công, nghỉ phép và tình trạng đi làm.",
  shiftInfo: "Quản lý danh sách nhân viên ca ngày và ca đêm.",
  calendarInfo: "Quản lý lịch sản xuất, đào tạo và kiểm tra thiết bị.",
  translationInfo: "Thông báo mới sẽ hiển thị bằng tiếng Hàn cho đến khi kết nối dịch tự động.",
  noEvents: "Chưa có lịch trình nào.",
  noticeCount: "Thông báo",
  teamCount: "Đội sản xuất",
  languageCount: "Ngôn ngữ",
  welcome: "Cùng xây dựng môi trường làm việc an toàn và hiệu quả.",
  loading: "Đang tải thông báo...",
},

export default function Home() {
  const [lang, setLang] = useState<Lang>("ko");
  const [team, setTeam] = useState<Team>("newmaterial");
  const [page, setPage] = useState<Page>("dashboard");
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

const [calendarDate, setCalendarDate] = useState<Date | null>(null);

useEffect(() => {
  const today = new Date();
  setCalendarDate(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
}, []);

  const t = UI[lang];

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

    const interval = window.setInterval(() => {
      void loadNotices();
    }, 15000);

    return () => window.clearInterval(interval);
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
    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage("로그아웃 실패: " + error.message);
      return;
    }

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
    setPage("notice");
    setTeam(notice.team);
    setEditingId(notice.id);
    setInputText(notice.content_ko);
    setImportant(notice.important);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteNotice = async (id: number) => {
    if (!isAdmin || busy) return;

    if (!window.confirm("공지사항을 삭제하시겠습니까?")) return;

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
      setMessage("삭제 권한이 없거나 공지를 찾을 수 없습니다.");
    } else {
      if (editingId === id) resetForm();
      setMessage("공지사항이 삭제되었습니다.");
      await loadNotices();
    }

    setBusy(false);
  };

  const navigate = (selectedPage: Page, selectedTeam?: Team) => {
    setPage(selectedPage);
    if (selectedTeam) setTeam(selectedTeam);
    setMenuOpen(false);
    resetForm();
    setMessage("");
  };

  const getContent = (notice: Notice) => {
    const key = `content_${lang}` as keyof Notice;
    return String(notice[key] || notice.content_ko);
  };

  const teamNotices = notices.filter((n) => n.team === team);

  const currentTitle =
    page === "notice" || page === "attendance" || page === "shift"
      ? `${t[team]} / ${t[page]}`
      : t[page];

  const menuButton = (label: string, selected: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
        selected
          ? "bg-white font-bold text-[#145C42] shadow-sm"
          : "text-[#D9F2E5] hover:bg-[#267553]"
      }`}
    >
      {label}
    </button>
  );

  const sidebar = (
    <div className="flex h-full flex-col bg-[#145C42] text-white">
      <div className="border-b border-[#34785B] p-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌿</span>
          <div>
            <div className="text-lg font-black tracking-wide">
              SERIM B&G
            </div>
            <div className="text-xs text-[#BDE7D0]">
              Production Management
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto p-3">
        {menuButton(
          `▦  ${t.dashboard}`,
          page === "dashboard",
          () => navigate("dashboard")
        )}

        {menuButton(
          `▣  ${t.calendar}`,
          page === "calendar",
          () => navigate("calendar")
        )}

        <div className="my-3 border-t border-[#34785B]" />

        <button
          onClick={() => setDivisionOpen(!divisionOpen)}
          className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left font-bold hover:bg-[#267553]"
        >
          <span>▣ {t.division}</span>
          <span>{divisionOpen ? "▾" : "▸"}</span>
        </button>

        {divisionOpen && (
          <div className="space-y-3 pl-2">
            {(["vacuum", "newmaterial"] as Team[]).map((item) => (
              <div key={item}>
                <button
                  onClick={() =>
                    setOpenTeams((prev) => ({
                      ...prev,
                      [item]: !prev[item],
                    }))
                  }
                  className="flex w-full justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-[#267553]"
                >
                  <span>{t[item]}</span>
                  <span>{openTeams[item] ? "▾" : "▸"}</span>
                </button>

                {openTeams[item] && (
                  <div className="ml-3 space-y-1">
                    {menuButton(
                      `• ${t.notice}`,
                      page === "notice" && team === item,
                      () => navigate("notice", item)
                    )}

                    {menuButton(
                      `• ${t.attendance}`,
                      page === "attendance" && team === item,
                      () => navigate("attendance", item)
                    )}

                    {menuButton(
                      `• ${t.shift}`,
                      page === "shift" && team === item,
                      () => navigate("shift", item)
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </nav>

      <div className="border-t border-[#34785B] p-4 text-xs text-[#BDE7D0]">
        © SERIM B&G
        <div className="mt-1">Eco-Friendly Production System</div>
      </div>
    </div>
  );

  const renderNotice = (notice: Notice) => (
    <article
      key={notice.id}
      className={`rounded-xl border border-[#E1EBE5] border-l-4 bg-white p-5 shadow-sm ${
        notice.important ? "border-l-red-500" : "border-l-[#168253]"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-[#E1F3E9] px-2.5 py-1 text-xs font-bold text-[#146B46]">
          {t[notice.team]}
        </span>

        {notice.important && (
          <span className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">
            IMPORTANT
          </span>
        )}

        <span className="ml-auto text-xs text-gray-400">
          {new Date(notice.created_at).toLocaleDateString("ko-KR")}
        </span>
      </div>

      <p className="whitespace-pre-line text-sm leading-7 text-gray-800 sm:text-base">
        {getContent(notice)}
      </p>

      {isAdmin && (
        <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-3">
          <button
            onClick={() => startEdit(notice)}
            className="rounded-lg border border-[#B7DCC7] px-4 py-2 text-sm font-medium text-[#146B46]"
          >
            {t.edit}
          </button>

          <button
            onClick={() => deleteNotice(notice.id)}
            disabled={busy}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 disabled:opacity-50"
          >
            {t.delete}
          </button>
        </div>
      )}
    </article>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-[#145C42] to-[#25865B] p-6 text-white shadow-sm">
        <div className="mb-2 text-sm text-[#C9EED8]">SERIM B&G</div>
        <h2 className="text-2xl font-bold">{t.dashboard}</h2>
        <p className="mt-2 text-sm leading-6 text-[#E0F4E8]">
          {t.welcome}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { value: notices.length, label: t.noticeCount },
          { value: 2, label: t.teamCount },
      { value: 6, label: t.languageCount },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-[#E1EBE5] bg-white p-4 shadow-sm"
          >
            <div className="text-2xl font-black text-[#168253]">
              {item.value}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {item.label}
            </div>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#145C42]">
            {t.latest}
          </h3>
        </div>

        {notices.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center text-gray-500">
            {t.empty}
          </div>
        ) : (
          notices.slice(0, 5).map(renderNotice)
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        {(["vacuum", "newmaterial"] as Team[]).map((item) => (
          <button
            key={item}
            onClick={() => navigate("notice", item)}
            className="rounded-xl border border-[#E1EBE5] bg-white p-5 text-left shadow-sm transition hover:border-[#168253]"
          >
            <div className="mb-2 text-sm font-bold text-[#145C42]">
              🏭 {t[item]}
            </div>
            <div className="text-xs text-gray-500">
              {t.notice} · {notices.filter((n) => n.team === item).length}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

const renderCalendar = () => {
  if (!calendarDate) {
    return (
      <div className="rounded-xl bg-white p-8 text-center">
        캘린더를 불러오는 중...
      </div>
    );
  }

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [
      ...Array.from({ length: firstDay }, () => 0),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    const moveMonth = (amount: number) => {
      setCalendarDate(new Date(year, month + amount, 1));
    };

    return (
      <div className="space-y-5">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-[#145C42]">
            {t.calendar}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {t.calendarInfo}
          </p>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <button
              onClick={() => moveMonth(-1)}
              className="rounded-lg border px-4 py-2"
              aria-label="Previous month"
            >
              ‹
            </button>

            <h3 className="text-lg font-bold text-[#145C42]">
              {year}년 {month + 1}월
            </h3>

            <button
              onClick={() => moveMonth(1)}
              className="rounded-lg border px-4 py-2"
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {["일", "월", "화", "수", "목", "금", "토"].map((day, i) => (
              <div
                key={day}
                className={`py-3 text-xs font-bold ${
                  i === 0
                    ? "text-red-500"
                    : i === 6
                    ? "text-blue-500"
                    : "text-gray-600"
                }`}
              >
                {day}
              </div>
            ))}

            {days.map((day, i) => (
              <div
                key={i}
                className={`flex min-h-12 items-start justify-center rounded-lg border p-2 text-sm sm:min-h-20 ${
                  day === 0
                    ? "border-transparent"
                    : "border-[#E4EEE7] bg-[#FAFCFA]"
                }`}
              >
                {day || ""}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 text-center text-sm text-gray-500 shadow-sm">
          {t.noEvents}
          <p className="mt-2 text-xs text-gray-400">
            {t.ready}
          </p>
        </div>
      </div>
    );
  };

  const renderPlaceholder = () => (
    <div className="space-y-5">
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-2 inline-block rounded-md bg-[#E1F3E9] px-3 py-1 text-xs font-bold text-[#146B46]">
          {t[team]}
        </div>

        <h2 className="mt-2 text-xl font-bold text-[#145C42]">
          {page === "attendance" ? t.attendance : t.shift}
        </h2>
      </div>

      <div className="rounded-xl border border-[#E1EBE5] bg-white px-5 py-16 text-center shadow-sm">
        <div className="mb-4 text-5xl">
          {page === "attendance" ? "📋" : "👥"}
        </div>

        <h3 className="text-lg font-bold text-[#145C42]">
          {t.ready}
        </h3>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
          {page === "attendance"
            ? t.attendanceInfo
            : t.shiftInfo}
        </p>
      </div>
    </div>
  );

  const renderNoticePage = () => (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#E1EBE5] bg-white p-5 shadow-sm">
        <div className="mb-2 inline-block rounded-md bg-[#E1F3E9] px-3 py-1 text-xs font-bold text-[#146B46]">
          {t.division}
        </div>
        <h2 className="text-xl font-bold text-[#145C42]">
          {t[team]}
        </h2>
        <p className="mt-1 text-sm text-gray-500">{t.notice}</p>
      </div>

      {isAdmin && (
        <div className="rounded-xl border border-[#CDE4D5] bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-bold text-[#145C42]">
            {editingId !== null ? t.edit : t.add}
          </h3>

          <textarea
            rows={5}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t.placeholder}
            className="w-full rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-[#168253]"
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
            {t.translationInfo}
          </p>

          <div className="mt-4 flex gap-2">
            <button
              onClick={saveNotice}
              disabled={busy || !inputText.trim()}
              className="rounded-lg bg-[#168253] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
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

      {teamNotices.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center text-gray-500 shadow-sm">
          {t.empty}
        </div>
      ) : (
        <div className="space-y-4">
          {teamNotices.map(renderNotice)}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F1F8F3] text-gray-900">
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
        <header className="sticky top-0 z-30 border-b border-[#D5E8DB] bg-white px-4 py-4 shadow-sm sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="rounded-lg bg-[#145C42] px-3 py-2 text-white md:hidden"
              aria-label="Open menu"
            >
              ☰
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="text-base font-bold text-[#145C42] sm:text-lg">
                {t.title}
              </h1>
              <p className="text-xs text-[#648778]">
                SERIM B&G · ECO-FRIENDLY PACKAGING
              </p>
            </div>

            {isAdmin ? (
              <button
                onClick={logout}
                className="shrink-0 rounded-lg bg-[#E1F3E9] px-3 py-2 text-xs font-bold text-[#146B46]"
              >
                {t.logout}
              </button>
            ) : (
              <button
                onClick={() => setShowLogin(!showLogin)}
                className="shrink-0 rounded-lg bg-[#145C42] px-3 py-2 text-xs text-white"
              >
                {showLogin ? "✕" : t.admin}
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {LANGUAGES.map((language) => (
              <button
                key={language.code}
                onClick={() => setLang(language.code)}
                className={`rounded-md px-2.5 py-2 text-xs font-semibold transition ${
                  lang === language.code
                    ? "bg-[#168253] text-white"
                    : "bg-[#E7F2EA] text-[#32684D] hover:bg-[#D0E8D9]"
                }`}
              >
                {language.label}
              </button>
            ))}
          </div>
        </header>

        <main className="mx-auto max-w-5xl p-4 sm:p-6">
          {message && (
            <div
              role="status"
              className="mb-4 rounded-lg border border-[#B7DCC7] bg-white p-3 text-sm text-[#145C42]"
            >
              {message}
            </div>
          )}

          {showLogin && !isAdmin && (
            <div className="mb-5 rounded-xl border border-[#D5E8DB] bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-bold text-[#145C42]">
                {t.login}
              </h2>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void login();
                }}
              >
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
                  className="rounded-lg bg-[#168253] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {t.login}
                </button>
              </form>
            </div>
          )}

          <div className="mb-5 text-xs text-[#648778]">
            {t.division} / {currentTitle}
          </div>

          {loading ? (
            <div className="rounded-xl bg-white p-10 text-center text-gray-500">
              {t.loading}
            </div>
          ) : page === "dashboard" ? (
            renderDashboard()
          ) : page === "calendar" ? (
            renderCalendar()
) : page === "notice" ? (
  renderNoticePage()
) : page === "attendance" ? (
  <AttendanceManager
    team={team}
    isAdmin={isAdmin}
  />
) : page === "shift" ? (
  <ShiftRoster
    team={team}
    isAdmin={isAdmin}
  />
) : (
  renderPlaceholder()
)}
        </main>
      </div>
    </div>
  );
}
