
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

const EMPLOYEES: Record<Team, Employee[]> = {
  vacuum: [
    ...[
      "정동훈", "박지현", "타라카", "로니에르",
      "트로이드", "제프리", "김민성", "판반튜엔", "황반뀌"
    ].map((name): Employee => ({ name, role: "operator" })),
    ...[
      "이윤숙", "요코", "아세리티", "마죠리",
      "백민정", "후이판", "프레카스", "머니스",
      "케삼", "둑안", "사우든", "바오람",
      "케사브", "씅찬타", "금호이", "페아",
      "키란", "설태현", "메세이", "림부",
      "기리라즈", "강갑철", "폰폴", "준다라",
      "천니", "군금래잉", "튼텅", "바첸다"
    ].map((name): Employee => ({ name, role: "worker" })),
  ],

  newmaterial: [
    "김석희", "박원식", "강동효", "주우팔", "송규옥",
    "장숙이", "김현준", "박세영", "디팍싱", "판넛",
    "소팟", "로타", "비노드", "김미숙", "이은"
  ].map((name): Employee => ({ name, role: "worker" })),
};

const TEAM_NAMES: Record<Team, string> = {
  vacuum: "진공성형팀",
  newmaterial: "신소재생산팀",
};

const STATUSES: { value: Status; label: string }[] = [
  { value: "present", label: "출근" },
  { value: "annual", label: "연차" },
  { value: "unpaid", label: "무급휴가" },
  { value: "am_half", label: "오전반차" },
  { value: "pm_half", label: "오후반차" },
];

function dateString(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(value: string, amount: number) {
  if (!value) return "";
  const d = new Date(`${value}T12:00:00`);
  d.setDate(d.getDate() + amount);
  return dateString(d);
}

function getMonday(value: string) {
  if (!value) return "";
  const d = new Date(`${value}T12:00:00`);
  return addDays(value, -((d.getDay() + 6) % 7));
}

function displayDate(value: string) {
  if (!value) return "";
  const d = new Date(`${value}T12:00:00`);
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${value} (${weekdays[d.getDay()]})`;
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
  const [roster, setRoster] = useState<Record<string, Shift | "">>({});
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [editRoster, setEditRoster] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [refresh, setRefresh] = useState(0);

  const employees = EMPLOYEES[team];
  const week = getMonday(date);

  const reload = () => setRefresh((n) => n + 1);

  useEffect(() => {
    setDate(dateString(new Date()));
  }, []);

  const loadData = useCallback(async () => {
    if (!date || !week) return;

    setLoading(true);

    const [confirmationResult, attendanceResult] = await Promise.all([
      supabase
        .from("attendance_confirmations")
        .select("team")
        .eq("work_date", date)
        .eq("team", team)
        .maybeSingle(),

      supabase
        .from("daily_attendance")
        .select("*")
        .eq("work_date", date)
        .eq("team", team),
    ]);

    const errors: string[] = [];

    if (confirmationResult.error) {
      errors.push(confirmationResult.error.message);
    }

    if (attendanceResult.error) {
      errors.push(attendanceResult.error.message);
    }

    const isConfirmed = !!confirmationResult.data;
    setConfirmed(isConfirmed);

    const daily = (attendanceResult.data ?? []) as DailyRecord[];
    setRecords(daily);

    const nextStatuses: Record<string, Status> = {};

    daily.forEach((r) => {
      nextStatuses[r.employee_name] = r.status;
    });

    setStatuses(nextStatuses);

    if (isAdmin) {
      const rosterResult = await supabase
        .from("weekly_assignments")
        .select("*")
        .eq("week_start", week)
        .eq("team", team);

      if (rosterResult.error) {
        errors.push(rosterResult.error.message);
      }

      const rows = (rosterResult.data ?? []) as Assignment[];

      setAssignments(rows);

      const nextRoster: Record<string, Shift | ""> = {};

      employees.forEach((employee) => {
        const found = rows.find(
          (r) => r.employee_name === employee.name
        );

        nextRoster[employee.name] = found?.shift ?? "";
      });

      setRoster(nextRoster);
    } else {
      setAssignments([]);
      setRoster({});
    }

    if (errors.length > 0) {
      setMessage("조회 오류: " + errors.join(" / "));
    }

    setLoading(false);
  }, [date, week, team, isAdmin, employees]);

  // 직원 배열은 팀별 고정 상수이므로 의존성 기준으로 안정적임
  useEffect(() => {
    void loadData();
  }, [loadData, refresh]);

  useEffect(() => {
    setEditRoster(false);
    setMessage("");
  }, [team]);

  const currentAssignments = useMemo(() => {
    if (isAdmin) {
      return assignments.filter((r) => r.shift === shift);
    }

    if (!confirmed) return [];

    return records
      .filter((r) => r.shift === shift)
      .map((r) => ({
        week_start: week,
        employee_name: r.employee_name,
        employee_role: r.employee_role,
        team: r.team,
        shift: r.shift,
      }));
  }, [assignments, records, isAdmin, confirmed, shift, week]);

  const visibleEmployees = currentAssignments
    .map((a) => ({
      name: a.employee_name,
      role: a.employee_role,
    }))
    .sort((a, b) => {
      const ai = employees.findIndex((e) => e.name === a.name);
      const bi = employees.findIndex((e) => e.name === b.name);
      return ai - bi;
    });

  const completedCount = assignments.filter(
    (a) => !!statuses[a.employee_name]
  ).length;

  const allChecked =
    assignments.length === employees.length &&
    completedCount === employees.length;

  const saveRoster = async () => {
    if (!isAdmin || busy || !week) return;

    const missing = employees.filter((e) => !roster[e.name]);

    if (missing.length > 0) {
      setMessage(
        `${missing.length}명의 주간/야간 근무조를 지정해 주세요.`
      );
      return;
    }

    setBusy(true);
    setMessage("");

    const { data: confirmations, error: checkError } =
      await supabase
        .from("attendance_confirmations")
        .select("work_date")
        .eq("team", team)
        .gte("work_date", week)
        .lte("work_date", addDays(week, 6))
        .limit(1);

    if (checkError) {
      setMessage("확정 여부 확인 실패: " + checkError.message);
      setBusy(false);
      return;
    }

    if (confirmations?.length) {
      setMessage(
        "이번 주에 확정된 출근표가 있어 근무조를 변경할 수 없습니다."
      );
      setBusy(false);
      return;
    }

    const rows: Assignment[] = employees.map((e) => ({
      week_start: week,
      employee_name: e.name,
      employee_role: e.role,
      team,
      shift: roster[e.name] as Shift,
    }));

    const { error } = await supabase
      .from("weekly_assignments")
      .upsert(rows, {
        onConflict: "week_start,employee_name",
      });

    if (error) {
      setMessage("근무조 저장 실패: " + error.message);
    } else {
      setMessage("이번 주 근무조가 저장되었습니다.");
      setEditRoster(false);
      reload();
    }

    setBusy(false);
  };

  const saveAttendance = async (finalize: boolean) => {
    if (!isAdmin || busy || !date || confirmed) return;

    if (assignments.length !== employees.length) {
      setMessage("먼저 전체 인원의 주간/야간 배정을 완료해 주세요.");
      return;
    }

    if (finalize && !allChecked) {
      setMessage("모든 직원의 출근 유형을 선택해야 확정할 수 있습니다.");
      return;
    }

    const rows = assignments.flatMap((a) => {
      const status = statuses[a.employee_name];
      if (!status) return [];

      return [{
        work_date: date,
        employee_name: a.employee_name,
        employee_role: a.employee_role,
        team,
        shift: a.shift,
        status,
        updated_at: new Date().toISOString(),
      }];
    });

    setBusy(true);
    setMessage("");

    if (rows.length > 0) {
      const { error } = await supabase
        .from("daily_attendance")
        .upsert(rows, {
          onConflict: "work_date,employee_name",
        });

      if (error) {
        setMessage("출근표 저장 실패: " + error.message);
        setBusy(false);
        return;
      }
    }

    if (finalize) {
      const { error } = await supabase.rpc(
        "confirm_attendance",
        {
          p_date: date,
          p_team: team,
        }
      );

      if (error) {
        setMessage("출근표 확정 실패: " + error.message);
      } else {
        setMessage("출근표 확정 완료! 작업자에게 공개되었습니다.");
        reload();
      }
    } else {
      setMessage("출근 상태를 임시 저장했습니다.");
      reload();
    }

    setBusy(false);
  };

  const reopen = async () => {
    if (!isAdmin || busy || !confirmed) return;

    if (!window.confirm("출근표 확정을 해제하시겠습니까?")) {
      return;
    }

    setBusy(true);

    const { error } = await supabase
      .from("attendance_confirmations")
      .delete()
      .eq("work_date", date)
      .eq("team", team);

    if (error) {
      setMessage("확정 해제 실패: " + error.message);
    } else {
      setMessage("확정이 해제되었습니다. 수정 후 다시 확정하세요.");
      reload();
    }

    setBusy(false);
  };

  const statusLabel = (status?: Status) =>
    STATUSES.find((s) => s.value === status)?.label ?? "미체크";

  const statusColor = (status?: Status) => {
    if (status === "present") return "bg-green-100 text-green-800";
    if (status === "annual") return "bg-blue-100 text-blue-800";
    if (status === "unpaid") return "bg-orange-100 text-orange-800";
    if (status) return "bg-purple-100 text-purple-800";
    return "bg-gray-100 text-gray-500";
  };

  const summary = STATUSES.map((s) => ({
    ...s,
    count: visibleEmployees.filter(
      (e) => statuses[e.name] === s.value
    ).length,
  }));

  const renderGroup = (role: Role, label: string) => {
    const group = visibleEmployees.filter((e) => e.role === role);

    if (team === "newmaterial" && role === "operator") {
      return null;
    }

    return (
      <section className="space-y-2">
        <h3 className="text-base font-bold text-[#145C42]">
          {label} ({group.length}명)
        </h3>

        {group.length === 0 ? (
          <div className="rounded-lg bg-white p-5 text-sm text-gray-400">
            배정된 인원이 없습니다.
          </div>
        ) : (
          group.map((employee) => (
            <div
              key={employee.name}
              className="rounded-lg border border-[#E1EBE5] bg-white p-3 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold">
                  {employee.name}
                </span>

                <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColor(statuses[employee.name])}`}>
                  {statusLabel(statuses[employee.name])}
                </span>
              </div>

              {isAdmin && !confirmed && (
                <div className="grid grid-cols-5 gap-1">
                  {STATUSES.map((status) => (
                    <button
                      key={status.value}
                      onClick={() =>
                        setStatuses((prev) => ({
                          ...prev,
                          [employee.name]: status.value,
                        }))
                      }
                      className={`rounded-md px-1 py-2 text-[10px] sm:text-xs ${
                        statuses[employee.name] === status.value
                          ? "bg-[#168253] font-bold text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </section>
    );
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="text-sm font-medium text-[#168253]">
          생산본부 / {TEAM_NAMES[team]}
        </div>

        <h2 className="mt-1 text-xl font-bold text-[#145C42]">
          일일 출근현황
        </h2>

        <div className="mt-5 flex items-center justify-center gap-2">
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

        <p className="mt-3 text-center text-base font-bold">
          {displayDate(date)}
        </p>

        <p className="mt-1 text-center text-xs text-gray-500">
          적용 주간: {week} ~ {addDays(week, 6)}
        </p>
      </div>

      {message && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-white p-3 text-sm text-[#145C42]"
        >
          {message}
        </div>
      )}

      {false && isAdmin && (
        <div className="rounded-xl border border-green-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-[#145C42]">
                주간 / 야간 인원 배정
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {TEAM_NAMES[team]} 총 {employees.length}명
              </p>
            </div>

            <button
              onClick={() => setEditRoster((prev) => !prev)}
              className="rounded-lg bg-[#145C42] px-3 py-2 text-sm text-white"
            >
              {editRoster ? "닫기" : "근무조 설정"}
            </button>
          </div>

          {editRoster && (
            <div className="mt-4 space-y-4">
              {team === "vacuum" && (
                <div>
                  <h4 className="mb-2 font-bold">오퍼레이터 (9명)</h4>
                  <div className="space-y-2">
                    {employees.filter((e) => e.role === "operator")
                      .map((e) => (
                        <div key={e.name}
                          className="flex items-center justify-between border-b py-2">
                          <span className="text-sm font-medium">{e.name}</span>
                          <select
                            value={roster[e.name] ?? ""}
                            onChange={(event) =>
                              setRoster((prev) => ({
                                ...prev,
                                [e.name]: event.target.value as Shift | "",
                              }))
                            }
                            className="rounded-lg border p-2 text-sm"
                          >
                            <option value="">미배정</option>
                            <option value="day">☀️ 주간</option>
                            <option value="night">🌙 야간</option>
                          </select>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="mb-2 font-bold">
                  작업자 ({employees.filter((e) => e.role === "worker").length}명)
                </h4>

                <div className="space-y-2">
                  {employees.filter((e) => e.role === "worker")
                    .map((e) => (
                      <div key={e.name}
                        className="flex items-center justify-between border-b py-2">
                        <span className="text-sm font-medium">{e.name}</span>
                        <select
                          value={roster[e.name] ?? ""}
                          onChange={(event) =>
                            setRoster((prev) => ({
                              ...prev,
                              [e.name]: event.target.value as Shift | "",
                            }))
                          }
                          className="rounded-lg border p-2 text-sm"
                        >
                          <option value="">미배정</option>
                          <option value="day">☀️ 주간</option>
                          <option value="night">🌙 야간</option>
                        </select>
                      </div>
                    ))}
                </div>
              </div>

              <button
                onClick={saveRoster}
                disabled={busy}
                className="w-full rounded-lg bg-[#168253] p-3 font-bold text-white disabled:opacity-50"
              >
                이번 주 근무조 저장
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShift("day")}
          className={`rounded-xl border p-4 font-bold ${
            shift === "day"
              ? "border-[#168253] bg-[#DDF2E5] text-[#145C42]"
              : "bg-white text-gray-500"
          }`}
        >
          ☀️ 주간
        </button>

        <button
          onClick={() => setShift("night")}
          className={`rounded-xl border p-4 font-bold ${
            shift === "night"
              ? "border-[#168253] bg-[#DDF2E5] text-[#145C42]"
              : "bg-white text-gray-500"
          }`}
        >
          🌙 야간
        </button>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
        <span className="font-bold">{TEAM_NAMES[team]}</span>

        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
          confirmed
            ? "bg-green-100 text-green-800"
            : "bg-gray-100 text-gray-600"
        }`}>
          {confirmed ? "출근표 확정 완료" : "미확정"}
        </span>
      </div>

      {loading ? (
        <div className="rounded-xl bg-white p-8 text-center">
          출석현황 불러오는 중...
        </div>
      ) : !isAdmin && !confirmed ? (
        <div className="rounded-xl bg-white p-10 text-center text-gray-500">
          아직 확정되지 않은 출근표입니다.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {summary.map((s) => (
              <div key={s.value}
                className="rounded-lg bg-white p-3 text-center shadow-sm">
                <div className="text-xl font-bold text-[#168253]">
                  {s.count}
                </div>
                <div className="mt-1 text-xs">{s.label}</div>
              </div>
            ))}
          </div>

          {team === "vacuum" && renderGroup("operator", "오퍼레이터")}
          {renderGroup("worker", "작업자")}

          {isAdmin && (
            <div className="sticky bottom-3 rounded-xl border border-green-200 bg-white p-4 shadow-lg">
              <div className="mb-3 text-sm">
                출근체크 완료: {completedCount} / {employees.length}명
              </div>

              {confirmed ? (
                <button
                  onClick={reopen}
                  disabled={busy}
                  className="w-full rounded-lg border border-orange-300 p-3 font-bold text-orange-700 disabled:opacity-50"
                >
                  출근표 확정 해제 / 수정
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => saveAttendance(false)}
                    disabled={busy || assignments.length !== employees.length}
                    className="rounded-lg border border-[#168253] p-3 font-bold text-[#168253] disabled:opacity-50"
                  >
                    임시 저장
                  </button>

                  <button
                    onClick={() => saveAttendance(true)}
                    disabled={busy || !allChecked}
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
