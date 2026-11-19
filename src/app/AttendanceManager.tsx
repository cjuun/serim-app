
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

type Team = "vacuum" | "newmaterial";
type Shift = "day" | "night";
type Role = "operator" | "worker";
type Status = "present" | "annual" | "unpaid" | "am_half" | "pm_half";

type Employee = {
  name: string;
  role: Role;
};

type Assignment = {
  week_start: string;
  employee_name: string;
  employee_role: Role;
  team: Team;
  shift: Shift;
};

type DailyRecord = {
  work_date: string;
  employee_name: string;
  employee_role: Role;
  team: Team;
  shift: Shift;
  status: Status;
};

const OPERATORS = [
  "정동훈", "박지현", "타라카", "로니에르",
  "트로이드", "제프리", "김민성", "판반튜엔", "황반뀌",
];

const WORKERS = [
  "이윤숙", "요코", "아세리티", "마죠리",
  "백민정", "후이판", "프레카스", "머니스",
  "케삼", "둑안", "사우든", "바오람",
  "케사브", "씅찬타", "금호이", "페아",
  "키란", "설태현", "메세이", "림부",
  "기리라즈", "강갑철", "폰폴", "준다라",
  "천니", "군금래잉", "튼텅", "바첸다",
];

const EMPLOYEES: Employee[] = [
  ...OPERATORS.map((name): Employee => ({
    name, role: "operator",
  })),
  ...WORKERS.map((name): Employee => ({
    name, role: "worker",
  })),
];

const STATUSES: { value: Status; label: string }[] = [
  { value: "present", label: "출근" },
  { value: "annual", label: "연차" },
  { value: "unpaid", label: "무급휴가" },
  { value: "am_half", label: "오전반차" },
  { value: "pm_half", label: "오후반차" },
];

const TEAM_NAMES: Record<Team, string> = {
  vacuum: "진공성형팀",
  newmaterial: "신소재생산팀",
};

function toDateString(d: Date) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function addDays(date: string, amount: number) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + amount);
  return toDateString(d);
}

function getMonday(date: string) {
  const d = new Date(`${date}T12:00:00`);
  const offset = (d.getDay() + 6) % 7;
  return addDays(date, -offset);
}

function displayDate(date: string) {
  const d = new Date(`${date}T12:00:00`);
  return `${date} (${["일","월","화","수","목","금","토"][d.getDay()]})`;
}

export default function AttendanceManager({
  team,
  isAdmin,
}: {
  team: Team;
  isAdmin: boolean;
}) {
  const [date, setDate] = useState("");
  const [shift, setShift] = useState<Shift>("day");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [drafts, setDrafts] = useState<Record<string, {
    team: Team | "";
    shift: Shift | "";
  }>>({});
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [selected, setSelected] = useState<Record<string, Status>>({});
  const [confirmedTeams, setConfirmedTeams] = useState<Team[]>([]);
  const [editRoster, setEditRoster] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const week = date ? getMonday(date) : "";
  const isConfirmed = confirmedTeams.includes(team);

  useEffect(() => {
    setDate(toDateString(new Date()));
  }, []);

  const loadData = useCallback(async () => {
    if (!date || !week) return;

    setLoading(true);
    setMessage("");

    const [confirmationResult, recordResult] = await Promise.all([
      supabase.from("attendance_confirmations")
        .select("team")
        .eq("work_date", date),
      supabase.from("daily_attendance")
        .select("*")
        .eq("work_date", date),
    ]);

    const errors = [
      confirmationResult.error?.message,
      recordResult.error?.message,
    ].filter(Boolean);

    setConfirmedTeams(
      (confirmationResult.data ?? []).map((x) => x.team as Team)
    );

    const loadedRecords = (recordResult.data ?? []) as DailyRecord[];
    setRecords(loadedRecords);

    const nextSelected: Record<string, Status> = {};
    loadedRecords.forEach((r) => {
      nextSelected[r.employee_name] = r.status;
    });
    setSelected(nextSelected);

    if (isAdmin) {
      const rosterResult = await supabase
        .from("weekly_assignments")
        .select("*")
        .eq("week_start", week);

      if (rosterResult.error) {
        errors.push(rosterResult.error.message);
      }

      const roster = (rosterResult.data ?? []) as Assignment[];
      setAssignments(roster);

      const nextDrafts: Record<string, {
        team: Team | "";
        shift: Shift | "";
      }> = {};

      EMPLOYEES.forEach((employee) => {
        const row = roster.find(
          (r) => r.employee_name === employee.name
        );
        nextDrafts[employee.name] = {
          team: row?.team ?? "",
          shift: row?.shift ?? "",
        };
      });

      setDrafts(nextDrafts);
    } else {
      setAssignments([]);
      setDrafts({});
    }

    if (errors.length) {
      setMessage("조회 오류: " + errors.join(" / "));
    }

    setLoading(false);
  }, [date, week, isAdmin]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const assigned = useMemo(() => {
    if (!isAdmin) {
      return records
        .filter((r) => r.team === team && r.shift === shift)
        .map((r) => ({
          name: r.employee_name,
          role: r.employee_role,
        }));
    }

    return assignments
      .filter((r) => r.team === team && r.shift === shift)
      .map((r) => ({
        name: r.employee_name,
        role: r.employee_role,
      }));
  }, [assignments, records, team, shift, isAdmin]);

  const grouped = {
    operator: assigned.filter((e) => e.role === "operator"),
    worker: assigned.filter((e) => e.role === "worker"),
  };

  const teamAssignments = assignments.filter((a) => a.team === team);
  const completedCount = teamAssignments.filter(
    (a) => !!selected[a.employee_name]
  ).length;

  const saveRoster = async () => {
    if (!isAdmin || !week || busy) return;

    const allValid = EMPLOYEES.every((employee) => {
      const d = drafts[employee.name];
      return !!d?.team && !!d?.shift;
    });

    if (!allValid) {
      setMessage("전체 37명의 소속팀과 주/야 근무조를 지정해 주세요.");
      return;
    }

    // 이미 확정된 출근표가 있는 주에는 인원 재배정 방지
    const { data: existingConfirmations, error: checkError } =
      await supabase
        .from("attendance_confirmations")
        .select("work_date")
        .gte("work_date", week)
        .lte("work_date", addDays(week, 6))
        .limit(1);

    if (checkError) {
      setMessage(checkError.message);
      return;
    }

    if (existingConfirmations?.length) {
      setMessage(
        "이 주에 확정된 출근표가 있습니다. 재배정 전에 관리자 확인이 필요합니다."
      );
      return;
    }

    setBusy(true);

    const rows: Assignment[] = EMPLOYEES.map((employee) => ({
      week_start: week,
      employee_name: employee.name,
      employee_role: employee.role,
      team: drafts[employee.name].team as Team,
      shift: drafts[employee.name].shift as Shift,
    }));

    const { error } = await supabase
      .from("weekly_assignments")
      .upsert(rows, { onConflict: "week_start,employee_name" });

    setBusy(false);

    if (error) {
      setMessage("배정 저장 실패: " + error.message);
    } else {
      setMessage("주간 인원 배정이 저장되었습니다.");
      setEditRoster(false);
      await loadData();
    }
  };

  const saveDaily = async (confirm: boolean) => {
    if (!isAdmin || busy || !date || isConfirmed) return;

    const rows = teamAssignments.map((a) => {
      const status = selected[a.employee_name];
      if (!status) return null;

      return {
        work_date: date,
        employee_name: a.employee_name,
        employee_role: a.employee_role,
        team: a.team,
        shift: a.shift,
        status,
        updated_at: new Date().toISOString(),
      };
    }).filter((row): row is DailyRecord & {
      updated_at: string;
    } => row !== null);

    if (confirm && rows.length !== teamAssignments.length) {
      setMessage("해당 팀의 모든 근무자 출근 유형을 선택해야 확정할 수 있습니다.");
      return;
    }

    if (confirm && teamAssignments.length === 0) {
      setMessage("먼저 해당 주의 근무조를 배정해 주세요.");
      return;
    }

    setBusy(true);
    setMessage("");

    const { error } = rows.length
      ? await supabase.from("daily_attendance")
          .upsert(rows, { onConflict: "work_date,employee_name" })
      : { error: null };

    if (error) {
      setMessage("저장 실패: " + error.message);
      setBusy(false);
      return;
    }

    if (confirm) {
      const result = await supabase.rpc("confirm_attendance", {
        p_date: date,
        p_team: team,
      });

      if (result.error) {
        setMessage("확정 실패: " + result.error.message);
        setBusy(false);
        return;
      }

      setMessage("출근표가 확정되어 작업자에게 공개되었습니다.");
    } else {
      setMessage("출근 체크 내용을 임시 저장했습니다.");
    }

    setBusy(false);
    await loadData();
  };

  const reopen = async () => {
    if (!isAdmin || !isConfirmed || busy) return;
    if (!window.confirm("출근표 확정을 해제하고 다시 수정하시겠습니까?")) {
      return;
    }

    setBusy(true);
    const { error } = await supabase
      .from("attendance_confirmations")
      .delete()
      .eq("work_date", date)
      .eq("team", team);

    setBusy(false);

    if (error) {
      setMessage("확정 해제 실패: " + error.message);
    } else {
      setMessage("확정이 해제되었습니다. 수정 후 다시 확정하세요.");
      await loadData();
    }
  };

  const statusLabel = (status?: Status) =>
    STATUSES.find((s) => s.value === status)?.label ?? "미체크";

  const summary = STATUSES.map((s) => ({
    ...s,
    count: assigned.filter((a) => selected[a.name] === s.value).length,
  }));

  const statusClass = (status?: Status) =>
    status === "present" ? "bg-green-100 text-green-800"
    : status === "annual" ? "bg-blue-100 text-blue-800"
    : status === "unpaid" ? "bg-orange-100 text-orange-800"
    : status ? "bg-purple-100 text-purple-800"
    : "bg-gray-100 text-gray-500";

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-2 text-sm text-[#168253]">
          생산본부 / {TEAM_NAMES[team]}
        </div>
        <h2 className="text-xl font-bold text-[#145C42]">
          일일 출근현황
        </h2>

        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => setDate(addDays(date, -1))}
            disabled={!date}
            className="rounded-lg border px-3 py-2"
          >
            ‹
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="min-w-0 rounded-lg border p-2"
          />
          <button
            onClick={() => setDate(addDays(date, 1))}
            disabled={!date}
            className="rounded-lg border px-3 py-2"
          >
            ›
          </button>
        </div>

        <p className="mt-2 text-center text-sm text-gray-500">
          {date ? displayDate(date) : "날짜 선택"}
        </p>

        <p className="mt-1 text-center text-xs text-gray-400">
          적용 주간: {week} ~ {week ? addDays(week, 6) : ""}
        </p>
      </div>

      {message && (
        <div role="status" className="rounded-lg border border-green-200 bg-white p-3 text-sm">
          {message}
        </div>
      )}

      {isAdmin && (
        <div className="rounded-xl border border-green-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-[#145C42]">
                주간 인원 배정
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                한 주에 한 번 팀과 주/야를 지정합니다.
              </p>
            </div>
            <button
              onClick={() => setEditRoster((v) => !v)}
              className="rounded-lg bg-[#145C42] px-3 py-2 text-sm text-white"
            >
              {editRoster ? "닫기" : "인원 배정"}
            </button>
          </div>

          {editRoster && (
            <div className="mt-4 space-y-4">
              {([
                ["operator", "오퍼레이터"],
                ["worker", "작업자"],
              ] as const).map(([role, label]) => (
                <div key={role}>
                  <h4 className="mb-2 font-bold">{label}</h4>
                  <div className="space-y-2">
                    {EMPLOYEES.filter((e) => e.role === role).map((e) => (
                      <div
                        key={e.name}
                        className="grid grid-cols-[minmax(70px,1fr)_1fr_1fr] items-center gap-2 border-b py-2 text-sm"
                      >
                        <span className="font-medium">{e.name}</span>
                        <select
                          value={drafts[e.name]?.team ?? ""}
                          onChange={(ev) => setDrafts((p) => ({
                            ...p,
                            [e.name]: {
                              team: ev.target.value as Team,
                              shift: p[e.name]?.shift ?? "",
                            },
                          }))}
                          className="min-w-0 rounded border p-2"
                        >
                          <option value="">팀 선택</option>
                          <option value="vacuum">진공성형</option>
                          <option value="newmaterial">신소재</option>
                        </select>

                        <select
                          value={drafts[e.name]?.shift ?? ""}
                          onChange={(ev) => setDrafts((p) => ({
                            ...p,
                            [e.name]: {
                              team: p[e.name]?.team ?? "",
                              shift: ev.target.value as Shift,
                            },
                          }))}
                          className="min-w-0 rounded border p-2"
                        >
                          <option value="">근무조</option>
                          <option value="day">주간</option>
                          <option value="night">야간</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={saveRoster}
                disabled={busy}
                className="w-full rounded-lg bg-[#168253] p-3 font-bold text-white disabled:opacity-50"
              >
                주간 배정 저장
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {([
          ["day", "☀️ 주간"],
          ["night", "🌙 야간"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setShift(value)}
            className={`rounded-xl border p-4 font-bold ${
              shift === value
                ? "border-[#168253] bg-[#DDF2E5] text-[#145C42]"
                : "bg-white text-gray-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-lg bg-white p-4">
        <span className="font-bold">{TEAM_NAMES[team]}</span>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
          isConfirmed
            ? "bg-green-100 text-green-800"
            : "bg-gray-100 text-gray-600"
        }`}>
          {isConfirmed ? "확정 완료" : "미확정"}
        </span>
      </div>

      {loading ? (
        <div className="rounded-xl bg-white p-8 text-center">
          출석현황을 불러오는 중...
        </div>
      ) : !isAdmin && !isConfirmed ? (
        <div className="rounded-xl bg-white p-10 text-center text-gray-500">
          아직 확정되지 않은 출근표입니다.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {summary.map((s) => (
              <div
                key={s.value}
                className="rounded-lg bg-white p-3 text-center shadow-sm"
              >
                <div className="text-xl font-bold text-[#168253]">
                  {s.count}
                </div>
                <div className="mt-1 text-xs">{s.label}</div>
              </div>
            ))}
          </div>

          {([
            ["operator", "오퍼레이터"],
            ["worker", "작업자"],
          ] as const).map(([role, label]) => (
            <section key={role} className="space-y-2">
              <h3 className="font-bold text-[#145C42]">
                {label} ({grouped[role].length}명)
              </h3>

              {grouped[role].length === 0 ? (
                <div className="rounded-lg bg-white p-5 text-sm text-gray-400">
                  배정된 인원이 없습니다.
                </div>
              ) : grouped[role].map((employee) => (
                <div
                  key={employee.name}
                  className="rounded-lg border border-[#E1EBE5] bg-white p-3 shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold">{employee.name}</span>
                    <span className={`rounded-full px-2 py-1 text-xs ${statusClass(selected[employee.name])}`}>
                      {statusLabel(selected[employee.name])}
                    </span>
                  </div>

                  {isAdmin && !isConfirmed && (
                    <div className="grid grid-cols-5 gap-1">
                      {STATUSES.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => setSelected((p) => ({
                            ...p, [employee.name]: s.value,
                          }))}
                          className={`rounded-md px-1 py-2 text-[10px] sm:text-xs ${
                            selected[employee.name] === s.value
                              ? "bg-[#168253] font-bold text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </section>
          ))}

          {isAdmin && (
            <div className="sticky bottom-3 rounded-xl border border-green-200 bg-white p-4 shadow-lg">
              <div className="mb-3 text-sm text-gray-600">
                해당 팀 체크 완료: {completedCount} / {teamAssignments.length}명
              </div>

              {isConfirmed ? (
                <button
                  onClick={reopen}
                  disabled={busy}
                  className="w-full rounded-lg border border-orange-300 p-3 font-bold text-orange-700 disabled:opacity-50"
                >
                  확정 해제 / 수정
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => saveDaily(false)}
                    disabled={busy}
                    className="rounded-lg border border-[#168253] p-3 font-bold text-[#168253] disabled:opacity-50"
                  >
                    임시 저장
                  </button>
                  <button
                    onClick={() => saveDaily(true)}
                    disabled={
                      busy ||
                      teamAssignments.length === 0 ||
                      completedCount !== teamAssignments.length
                    }
                    className="rounded-lg bg-[#168253] p-3 font-bold text-white disabled:opacity-50"
                  >
                    출근표 확정
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
