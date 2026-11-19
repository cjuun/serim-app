
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

type Team = "vacuum" | "newmaterial";
type Role = "operator" | "worker";
type Shift = "day" | "night";

type Employee = {
  name: string;
  role: Role;
};

type SavedRow = {
  cycle_start: string;
  team: Team;
  employee_name: string;
  employee_role: Role;
  shift: Shift;
};

const EMPLOYEES: Record<Team, Employee[]> = {
  vacuum: [
    ...[
      "정동훈", "박지현", "타라카",
      "로니에르", "트로이드", "제프리",
      "김민성", "판반튜엔", "황반뀌"
    ].map((name): Employee => ({
      name,
      role: "operator"
    })),

    ...[
      "이윤숙", "요코", "아세리티", "마죠리",
      "백민정", "후이판", "프레카스", "머니스",
      "케삼", "둑안", "사우든", "바오람",
      "케사브", "씅찬타", "금호이", "페아",
      "키란", "설태현", "메세이", "림부",
      "기리라즈", "강갑철", "폰폴", "준다라",
      "천니", "군금래잉", "튼텅", "바첸다"
    ].map((name): Employee => ({
      name,
      role: "worker"
    })),
  ],

  newmaterial: [
    "김석희", "박원식", "강동효",
    "주우팔", "송규옥", "장숙이",
    "김현준", "박세영", "디팍싱",
    "판넛", "소팟", "로타", "비노드",
    "김미숙", "이은"
  ].map((name): Employee => ({
    name,
    role: "worker"
  })),
};

const TEAM_NAMES: Record<Team, string> = {
  vacuum: "진공성형팀",
  newmaterial: "신소재생산팀",
};

const BASE_DATE = "2026-11-23";

function parseUTC(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatUTC(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(s: string, days: number) {
  const d = parseUTC(s);
  d.setUTCDate(d.getUTCDate() + days);
  return formatUTC(d);
}

function humanDate(s: string) {
  const d = parseUTC(s);
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    `${d.getUTCFullYear()}.${d.getUTCMonth() + 1}.` +
    `${d.getUTCDate()} (${weekdays[d.getUTCDay()]})`
  );
}

function cycleIndexFor(today: Date) {
  const current = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const base = parseUTC(BASE_DATE).getTime();
  const diff = Math.floor((current - base) / 86400000);

  return Math.max(0, Math.floor(diff / 14));
}

function initialDraft(people: Employee[]) {
  const result: Record<string, Shift | ""> = {};

  people.forEach((person) => {
    result[person.name] = "";
  });

  return result;
}

export default function ShiftRoster({
  team,
  isAdmin,
}: {
  team: Team;
  isAdmin: boolean;
}) {
  const employees = EMPLOYEES[team];

  const [cycleIndex, setCycleIndex] = useState(0);
  const [draft, setDraft] = useState<Record<string, Shift | "">>({});
  const [saved, setSaved] = useState<SavedRow[]>([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [refresh, setRefresh] = useState(0);

  const cycleStart = useMemo(
    () => addDays(BASE_DATE, cycleIndex * 14),
    [cycleIndex]
  );

  const cycleEnd = addDays(cycleStart, 13);
  const secondWeekStart = addDays(cycleStart, 7);

  useEffect(() => {
    setCycleIndex(cycleIndexFor(new Date()));
  }, []);

  const loadRoster = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("shift_cycle_assignments")
      .select("*")
      .eq("cycle_start", cycleStart)
      .eq("team", team);

    if (error) {
      setMessage("교대명단 조회 오류: " + error.message);
      setSaved([]);
      setDraft(initialDraft(employees));
    } else {
      const rows = (data ?? []) as SavedRow[];
      setSaved(rows);

      const values = initialDraft(employees);

      rows.forEach((r) => {
        if (r.employee_name in values) {
          values[r.employee_name] = r.shift;
        }
      });

      setDraft(values);
    }

    setLoading(false);
  }, [cycleStart, team, employees]);

  useEffect(() => {
    void loadRoster();
  }, [loadRoster, refresh]);

  useEffect(() => {
    setEditing(false);
    setMessage("");
  }, [team, cycleIndex]);

  const savedMap = useMemo(() => {
    const map: Record<string, Shift> = {};

    saved.forEach((r) => {
      map[r.employee_name] = r.shift;
    });

    return map;
  }, [saved]);

  const hasCompleteRoster =
    saved.length === employees.length &&
    employees.every((e) => !!savedMap[e.name]);

  const dayPeople = employees.filter(
    (e) => savedMap[e.name] === "day"
  );

  const nightPeople = employees.filter(
    (e) => savedMap[e.name] === "night"
  );

  const selectedCount = employees.filter(
    (e) => !!draft[e.name]
  ).length;

  const setPersonShift = (name: string, shift: Shift) => {
    setDraft((prev) => ({
      ...prev,
      [name]: shift,
    }));
  };

  const setEveryone = (shift: Shift) => {
    const next: Record<string, Shift> = {};

    employees.forEach((person) => {
      next[person.name] = shift;
    });

    setDraft(next);
  };

  const copyPrevious = async () => {
    if (!isAdmin || busy || cycleIndex === 0) return;

    setBusy(true);
    setMessage("");

    const previousStart = addDays(cycleStart, -14);

    const { data, error } = await supabase
      .from("shift_cycle_assignments")
      .select("employee_name, shift")
      .eq("cycle_start", previousStart)
      .eq("team", team);

    if (error) {
      setMessage("이전 명단 조회 실패: " + error.message);
      setBusy(false);
      return;
    }

    const rows = data ?? [];

    if (rows.length !== employees.length) {
      setMessage("이전 주기의 명단이 완성되지 않았습니다.");
      setBusy(false);
      return;
    }

    const next = initialDraft(employees);

    rows.forEach((row) => {
      if (row.employee_name in next) {
        next[row.employee_name] = row.shift as Shift;
      }
    });

    if (employees.some((e) => !next[e.name])) {
      setMessage("이전 명단에서 일부 인원이 누락되었습니다.");
    } else {
      setDraft(next);
      setMessage("이전 주기의 근무조를 복사했습니다. 저장을 눌러 확정하세요.");
    }

    setBusy(false);
  };

  const swapShifts = () => {
    setDraft((prev) => {
      const next = { ...prev };

      employees.forEach((e) => {
        if (next[e.name] === "day") {
          next[e.name] = "night";
        } else if (next[e.name] === "night") {
          next[e.name] = "day";
        }
      });

      return next;
    });
  };

  const saveRoster = async () => {
    if (!isAdmin || busy || selectedCount !== employees.length) {
      setMessage("전체 직원의 주간/야간을 설정해 주세요.");
      return;
    }

    const people = employees.map((e) => ({
      employee_name: e.name,
      employee_role: e.role,
      shift: draft[e.name],
    }));

    setBusy(true);
    setMessage("");

    const { error } = await supabase.rpc("save_shift_cycle", {
      p_cycle_start: cycleStart,
      p_team: team,
      p_people: people,
    });

    setBusy(false);

    if (error) {
      setMessage("교대명단 저장 실패: " + error.message);
      return;
    }

    setMessage("교대명단을 저장했습니다. 2주간 출석체크에도 반영됩니다.");
    setEditing(false);
    setRefresh((n) => n + 1);
  };

  const renderPersonSetting = (person: Employee) => (
    <div
      key={person.name}
      className="grid grid-cols-[minmax(60px,1fr)_auto_auto] items-center gap-2 border-b border-gray-100 py-2"
    >
      <span className="text-sm font-medium">{person.name}</span>

      <button
        type="button"
        onClick={() => setPersonShift(person.name, "day")}
        className={`rounded-lg px-3 py-2 text-xs font-semibold ${
          draft[person.name] === "day"
            ? "bg-[#168253] text-white"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        ☀ 주간
      </button>

      <button
        type="button"
        onClick={() => setPersonShift(person.name, "night")}
        className={`rounded-lg px-3 py-2 text-xs font-semibold ${
          draft[person.name] === "night"
            ? "bg-[#394E79] text-white"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        ☾ 야간
      </button>
    </div>
  );

  const renderShiftGroup = (
    title: string,
    people: Employee[],
    style: string
  ) => {
    const operators = people.filter((p) => p.role === "operator");
    const workers = people.filter((p) => p.role === "worker");

    return (
      <section className={`rounded-xl border p-4 ${style}`}>
        <h3 className="mb-3 text-lg font-bold">
          {title} · {people.length}명
        </h3>

        {people.length === 0 ? (
          <p className="py-5 text-sm text-gray-500">
            배정된 직원이 없습니다.
          </p>
        ) : (
          <div className="space-y-4">
            {team === "vacuum" && operators.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-bold">
                  오퍼레이터 ({operators.length}명)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {operators.map((p) => (
                    <span
                      key={p.name}
                      className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm"
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {workers.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-bold">
                  작업자 ({workers.length}명)
                </h4>

                <div className="flex flex-wrap gap-2">
                  {workers.map((p) => (
                    <span
                      key={p.name}
                      className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm"
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold text-[#168253]">
          생산본부 / {TEAM_NAMES[team]}
        </div>

        <h2 className="mt-2 text-xl font-bold text-[#145C42]">
          주/야 교대명단
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          2026년 11월 23일을 기준으로 14일마다
          새로운 근무주기가 생성됩니다.
        </p>

        <div className="mt-5 rounded-xl bg-[#F1F8F3] p-4">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setCycleIndex((x) => Math.max(0, x - 1))}
              disabled={cycleIndex === 0}
              className="rounded-lg bg-white px-3 py-2 disabled:opacity-40"
              aria-label="이전 주기"
            >
              ‹
            </button>

            <div className="text-center">
              <div className="text-xs text-[#168253]">
                제{cycleIndex + 1}주기
              </div>
              <div className="mt-1 text-sm font-bold text-[#145C42]">
                {humanDate(cycleStart)}
              </div>
              <div className="text-xs text-gray-500">~</div>
              <div className="text-sm font-bold text-[#145C42]">
                {humanDate(cycleEnd)}
              </div>
            </div>

            <button
              onClick={() => setCycleIndex((x) => x + 1)}
              className="rounded-lg bg-white px-3 py-2"
              aria-label="다음 주기"
            >
              ›
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="rounded-lg bg-white p-3">
              <div className="font-semibold">첫째 주</div>
              <div className="mt-1 text-gray-500">
                {cycleStart} ~ {addDays(cycleStart, 6)}
              </div>
            </div>

            <div className="rounded-lg bg-white p-3">
              <div className="font-semibold">둘째 주</div>
              <div className="mt-1 text-gray-500">
                {secondWeekStart} ~ {cycleEnd}
              </div>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div
          role="status"
          className="rounded-lg border border-[#CDE4D5] bg-white p-3 text-sm text-[#145C42]"
        >
          {message}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl bg-white p-10 text-center text-gray-500">
          교대명단을 불러오는 중...
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
            <div>
              <div className="font-bold">{TEAM_NAMES[team]}</div>
              <div className="mt-1 text-xs text-gray-500">
                등록 대상 {employees.length}명
              </div>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                hasCompleteRoster
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {hasCompleteRoster ? "근무조 설정 완료" : "미설정"}
            </span>
          </div>

          {isAdmin && (
            <div className="rounded-xl border border-green-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-[#145C42]">
                    관리자 근무조 설정
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    해당 2주 전체에 동일하게 적용됩니다.
                  </p>
                </div>

                <button
                  onClick={() => setEditing((x) => !x)}
                  className="shrink-0 rounded-lg bg-[#145C42] px-4 py-2 text-sm text-white"
                >
                  {editing ? "닫기" : "근무조 설정"}
                </button>
              </div>

              {editing && (
                <div className="mt-5 space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={copyPrevious}
                      disabled={busy || cycleIndex === 0}
                      className="rounded-lg border border-green-200 p-3 text-xs font-semibold text-[#145C42] disabled:opacity-40"
                    >
                      이전 명단 복사
                    </button>

                    <button
                      onClick={swapShifts}
                      className="rounded-lg border border-blue-200 p-3 text-xs font-semibold text-[#394E79]"
                    >
                      주간 ↔ 야간 바꾸기
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setEveryone("day")}
                      className="rounded-lg bg-[#E1F3E9] px-3 py-2 text-xs text-[#145C42]"
                    >
                      전체 주간
                    </button>

                    <button
                      onClick={() => setEveryone("night")}
                      className="rounded-lg bg-[#E8EDF7] px-3 py-2 text-xs text-[#394E79]"
                    >
                      전체 야간
                    </button>
                  </div>

                  {team === "vacuum" && (
                    <section>
                      <h4 className="mb-2 font-bold text-[#145C42]">
                        오퍼레이터 (9명)
                      </h4>

                      {employees
                        .filter((e) => e.role === "operator")
                        .map(renderPersonSetting)}
                    </section>
                  )}

                  <section>
                    <h4 className="mb-2 font-bold text-[#145C42]">
                      작업자 (
                      {employees.filter((e) => e.role === "worker").length}명)
                    </h4>

                    {employees
                      .filter((e) => e.role === "worker")
                      .map(renderPersonSetting)}
                  </section>

                  <div className="sticky bottom-3 rounded-xl border bg-white p-3 shadow-lg">
                    <p className="mb-2 text-sm text-gray-600">
                      근무조 배정: {selectedCount}/{employees.length}명
                    </p>

                    <button
                      onClick={saveRoster}
                      disabled={busy || selectedCount !== employees.length}
                      className="w-full rounded-lg bg-[#168253] p-3 font-bold text-white disabled:opacity-50"
                    >
                      {busy ? "저장 중..." : "2주 교대명단 저장"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!hasCompleteRoster ? (
            <div className="rounded-xl bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
              아직 이 기간의 주/야 교대명단이 등록되지 않았습니다.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {renderShiftGroup(
                "☀️ 주간 근무",
                dayPeople,
                "border-green-200 bg-[#EDF8F0]"
              )}

              {renderShiftGroup(
                "🌙 야간 근무",
                nightPeople,
                "border-blue-200 bg-[#EEF2FB]"
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
