export type Lang = 'ko' | 'en' | 'ne' | 'km' | 'tl' | 'vi';
export type Team = 'vacuum' | 'newmaterial';
export type Role = 'operator' | 'worker';
export type Shift = 'day' | 'night';
export type Status = 'present' | 'annual' | 'unpaid' | 'am_half' | 'pm_half';

export const languages: { code: Lang; label: string }[] = [
  {code:'ko',label:'🇰🇷 한국어'}, {code:'en',label:'🇺🇸 English'},
  {code:'ne',label:'🇳🇵 नेपाली'}, {code:'km',label:'🇰🇭 ខ្មែរ'},
  {code:'tl',label:'🇵🇭 Filipino'}, {code:'vi',label:'🇻🇳 Tiếng Việt'},
];

// Every visible system label is translated. Employee names stay unchanged as record identifiers.
const dict = {
  brand: ['세림비앤지 생산관리','SERIM B&G Production','SERIM B&G उत्पादन','ផលិតកម្ម SERIM B&G','Produksyon ng SERIM B&G','Quản lý sản xuất SERIM B&G'],
  dashboard: ['대시보드','Dashboard','ड्यासबोर्ड','ផ្ទាំងគ្រប់គ្រង','Dashboard','Bảng điều khiển'],
  reports: ['월별 출석 보고서','Attendance reports','उपस्थिति रिपोर्ट','របាយការណ៍វត្តមាន','Ulat ng attendance','Báo cáo chấm công'],
  calendar: ['캘린더','Calendar','पात्रो','ប្រតិទិន','Kalendaryo','Lịch tổng hợp'],
  division: ['생산본부','Production Division','उत्पादन विभाग','ផ្នែកផលិតកម្ម','Dibisyon ng Produksyon','Bộ phận sản xuất'],
  vacuum: ['진공성형팀','Vacuum Forming Team','भ्याकुम फर्मिङ टोली','ក្រុមបង្កើតទម្រង់សុញ្ញាកាស','Vacuum Forming Team','Đội tạo hình chân không'],
  newmaterial: ['신소재생산팀','New Materials Team','नयाँ सामग्री टोली','ក្រុមផលិតសម្ភារៈថ្មី','New Materials Team','Đội sản xuất vật liệu mới'],
  notice: ['공지사항','Notices','सूचनाहरू','សេចក្តីជូនដំណឹង','Mga anunsyo','Thông báo'],
  attendance: ['출석체크','Attendance','उपस्थिति','វត្តមាន','Pagpasok','Chấm công'],
  shift: ['주/야 교대명단','Day/Night Roster','दिन/रात सिफ्ट सूची','បញ្ជីវេនថ្ងៃ/យប់','Listahan ng araw/gabi','Danh sách ca ngày/đêm'],
  admin: ['관리자','Admin','प्रशासक','អ្នកគ្រប់គ្រង','Admin','Quản trị viên'],
  login: ['관리자 로그인','Admin sign in','प्रशासक लगइन','ចូលគណនីអ្នកគ្រប់គ្រង','Admin login','Đăng nhập quản trị'],
  logout: ['로그아웃','Sign out','लगआउट','ចាកចេញ','Mag-logout','Đăng xuất'],
  email: ['이메일','Email','इमेल','អ៊ីមែល','Email','Email'],
  password: ['비밀번호','Password','पासवर्ड','ពាក្យសម្ងាត់','Password','Mật khẩu'],
  save: ['저장','Save','सुरक्षित गर्नुहोस्','រក្សាទុក','I-save','Lưu'],
  cancel: ['취소','Cancel','रद्द','បោះបង់','Kanselahin','Hủy'],
  edit: ['수정','Edit','सम्पादन','កែប្រែ','Baguhin','Chỉnh sửa'],
  remove: ['삭제','Delete','मेटाउनुहोस्','លុប','Burahin','Xóa'],
  addNotice: ['공지 등록','Post notice','सूचना थप्नुहोस्','បង្ហោះសេចក្តីជូនដំណឹង','Mag-post ng anunsyo','Đăng thông báo'],
  important: ['중요 공지','Important','महत्त्वपूर्ण','សំខាន់','Mahalaga','Quan trọng'],
  noticeText: ['한국어 공지 내용을 입력하세요.','Enter the notice in Korean.','कोरियाली भाषामा सूचना लेख्नुहोस्।','សរសេរសេចក្តីជូនដំណឹងជាភាសាកូរ៉េ។','Isulat ang anunsyo sa Korean.','Nhập thông báo bằng tiếng Hàn.'],
  emptyNotice: ['등록된 공지사항이 없습니다.','No notices posted.','कुनै सूचना छैन।','មិនទាន់មានសេចក្តីជូនដំណឹងទេ។','Wala pang anunsyo.','Chưa có thông báo.'],
  latest: ['최근 공지사항','Latest notices','नयाँ सूचनाहरू','សេចក្តីជូនដំណឹងថ្មីៗ','Mga bagong anunsyo','Thông báo mới nhất'],
  countNotice: ['등록 공지','Notices','सूचनाहरू','សេចក្តីជូនដំណឹង','Anunsyo','Thông báo'],
  countTeams: ['운영 팀','Teams','टोली','ក្រុម','Mga team','Đội sản xuất'],
  countLanguages: ['지원 언어','Languages','भाषाहरू','ភាសា','Mga wika','Ngôn ngữ'],
  welcome: ['안전하고 효율적인 생산 현장을 함께 만들어갑니다.','Building a safe and efficient workplace together.','सुरक्षित र प्रभावकारी कार्यस्थल बनाऔँ।','រួមគ្នាបង្កើតកន្លែងការងារដែលមានសុវត្ថិភាព និងប្រសិទ្ធភាព។','Sama-sama para sa ligtas at maayos na trabaho.','Cùng xây dựng môi trường làm việc an toàn và hiệu quả.'],
  loading: ['불러오는 중...','Loading...','लोड हुँदैछ...','កំពុងទាញយក...','Naglo-load...','Đang tải...'],
  ready: ['준비 중인 기능입니다.','Feature coming soon.','यो सुविधा तयार हुँदैछ।','មុខងារនេះកំពុងរៀបចំ។','Inihahanda pa ang tampok.','Chức năng đang được chuẩn bị.'],
  calendarInfo: ['생산일정, 교육 및 설비점검 일정을 추가할 예정입니다.','Production, training and inspection schedules will be added.','उत्पादन, तालिम र निरीक्षण तालिका थपिनेछ।','នឹងបន្ថែមកាលវិភាគផលិតកម្ម បណ្តុះបណ្តាល និងត្រួតពិនិត្យ។','Idadagdag ang iskedyul ng produksyon, pagsasanay at inspeksiyon.','Sẽ bổ sung lịch sản xuất, đào tạo và kiểm tra thiết bị.'],
  noEvents: ['등록된 일정이 없습니다.','No events yet.','अहिलेसम्म कुनै कार्यक्रम छैन।','មិនទាន់មានកម្មវិធីទេ។','Wala pang iskedyul.','Chưa có lịch trình.'],
  sun: ['일','Sun','आइत','អាទិត្យ','Lin','CN'], mon:['월','Mon','सोम','ចន្ទ','Lun','T2'], tue:['화','Tue','मङ्गल','អង្គារ','Mar','T3'], wed:['수','Wed','बुध','ពុធ','Miy','T4'], thu:['목','Thu','बिही','ព្រហស្បតិ៍','Huw','T5'], fri:['금','Fri','शुक्र','សុក្រ','Biy','T6'], sat:['토','Sat','शनि','សៅរ៍','Sab','T7'],
  month: ['월','Month','महिना','ខែ','Buwan','Tháng'],
  operator: ['오퍼레이터','Operator','अपरेटर','ប្រតិបត្តិករ','Operator','Người vận hành'],
  worker: ['작업자','Worker','कामदार','កម្មករ','Manggagawa','Công nhân'],
  day: ['주간','Day shift','दिउँसो','វេនថ្ងៃ','Day shift','Ca ngày'],
  night: ['야간','Night shift','राति','វេនយប់','Night shift','Ca đêm'],
  present: ['출근','Present','उपस्थित','មកធ្វើការ','Pumasok','Đi làm'],
  annual: ['연차','Annual leave','वार्षिक बिदा','ឈប់សម្រាកប្រចាំឆ្នាំ','Annual leave','Nghỉ phép năm'],
  unpaid: ['무급휴가','Unpaid leave','बेतलबी बिदा','ឈប់សម្រាកគ្មានប្រាក់ខែ','Walang bayad na leave','Nghỉ không lương'],
  am_half: ['오전반차','Morning half-day','बिहान आधा बिदा','ឈប់ពេលព្រឹក','Morning half-day','Nghỉ nửa buổi sáng'],
  pm_half: ['오후반차','Afternoon half-day','दिउँसो आधा बिदा','ឈប់ពេលរសៀល','Afternoon half-day','Nghỉ nửa buổi chiều'],
  unchecked: ['미체크','Unchecked','जाँच बाँकी','មិនទាន់កត់ត្រា','Hindi pa na-check','Chưa chấm'],
  total: ['전체','Total','जम्मा','សរុប','Kabuuan','Tổng'],
  people: ['명','people','जना','នាក់','tao','người'],
  workDate: ['근무일자','Work date','कामको मिति','កាលបរិច្ឆេទធ្វើការ','Petsa ng trabaho','Ngày làm việc'],
  weekPeriod: ['적용 주간','Week','लागू हप्ता','សប្តាហ៍អនុវត្ត','Linggo','Tuần áp dụng'],
  dailyAttendance: ['일일 출근현황','Daily attendance','दैनिक उपस्थिति','វត្តមានប្រចាំថ្ងៃ','Arawang attendance','Chấm công hằng ngày'],
  rosterSettings: ['주/야 근무조 설정','Assign day/night shifts','दिन/रात सिफ्ट निर्धारण','កំណត់វេនថ្ងៃ/យប់','Itakda ang day/night shift','Phân ca ngày/đêm'],
  assignShift: ['근무조 설정','Set shifts','सिफ्ट सेट','កំណត់វេន','Itakda ang shift','Phân ca'],
  close: ['닫기','Close','बन्द','បិទ','Isara','Đóng'],
  unassigned: ['미배정','Unassigned','तोकिएको छैन','មិនទាន់កំណត់','Walang nakatalaga','Chưa phân ca'],
  saveWeek: ['이번 주 근무조 저장','Save this week','यो हप्ता सुरक्षित','រក្សាទុកសប្តាហ៍នេះ','I-save ang linggo','Lưu phân ca tuần này'],
  savedTemp: ['임시 저장','Save draft','अस्थायी सुरक्षित','រក្សាទុកបណ្ដោះអាសន្ន','I-save muna','Lưu tạm'],
  confirmAttendance: ['출근표 확정','Confirm attendance','उपस्थिति पुष्टि','បញ្ជាក់វត្តមាន','Kumpirmahin','Xác nhận chấm công'],
  reopen: ['확정 해제 / 수정','Reopen / edit','पुनः खोल्नुहोस्','បើកឡើងវិញ / កែ','Buksan muli / baguhin','Mở lại / sửa'],
  confirmed: ['확정 완료','Confirmed','पुष्टि भयो','បានបញ្ជាក់','Nakumpirma','Đã xác nhận'],
  unconfirmed: ['미확정','Not confirmed','पुष्टि भएको छैन','មិនទាន់បញ្ជាក់','Hindi pa kumpirmado','Chưa xác nhận'],
  progress: ['체크 완료','Completed','पूरा भयो','បានបញ្ចប់','Tapos na','Đã chấm'],
  notPublished: ['아직 확정되지 않은 출근표입니다.','Attendance is not yet confirmed.','उपस्थिति अझै पुष्टि भएको छैन।','បញ្ជីវត្តមានមិនទាន់បានបញ្ជាក់។','Hindi pa kumpirmado ang attendance.','Bảng chấm công chưa được xác nhận.'],
  cycleRoster: ['2주 주/야 교대명단','Two-week shift roster','दुई हप्ते सिफ्ट सूची','បញ្ជីវេនពីរសប្តាហ៍','2-linggong shift roster','Danh sách phân ca 2 tuần'],
  cycleHint: ['2026년 11월 23일부터 14일 단위로 운영합니다.','Runs in 14-day cycles from Nov 23, 2026.','२०२६ नोभेम्बर २३ देखि १४ दिने चक्र।','ចាប់ពីថ្ងៃទី ២៣ វិច្ឆិកា ២០២៦ រៀងរាល់ ១៤ ថ្ងៃ។','Bawat 14 araw mula Nobyembre 23, 2026.','Chu kỳ 14 ngày kể từ 23/11/2026.'],
  cycle: ['주기','Cycle','चक्र','វដ្ត','Siklo','Chu kỳ'],
  firstWeek: ['첫째 주','Week 1','पहिलो हप्ता','សប្តាហ៍ទី១','Unang linggo','Tuần 1'],
  secondWeek: ['둘째 주','Week 2','दोस्रो हप्ता','សប្តាហ៍ទី២','Ikalawang linggo','Tuần 2'],
  setupCompleted: ['근무조 설정 완료','Roster complete','सिफ्ट सेट भयो','កំណត់វេនរួចរាល់','Kumpleto ang shift','Đã phân ca'],
  setupMissing: ['근무조 미설정','Roster not set','सिफ्ट तोकिएको छैन','មិនទាន់កំណត់វេន','Wala pang shift','Chưa phân ca'],
  adminSettings: ['관리자 근무조 설정','Admin shift settings','प्रशासक सिफ्ट सेटिङ','ការកំណត់វេនរបស់អ្នកគ្រប់គ្រង','Admin shift settings','Quản lý phân ca'],
  twoWeeksSame: ['해당 2주 동안 같은 근무조를 적용합니다.','Same shift applies for both weeks.','दुई हप्ता एउटै सिफ्ट लागू।','អនុវត្តវេនដូចគ្នារយៈពេលពីរសប្តាហ៍។','Parehong shift sa dalawang linggo.','Áp dụng cùng ca trong hai tuần.'],
  suggestOpposite: ['이전 2주와 주/야 반대로 자동 배정','Suggest opposite shifts from previous cycle','अघिल्लो चक्रको उल्टो सिफ्ट सुझाव','ស្នើវេនផ្ទុយពីវដ្តមុន','Imungkahing baligtad na shift','Đề xuất đảo ca từ kỳ trước'],
  suggestReady: ['반대 근무조를 제안했습니다. 확인 후 저장하세요.','Opposite shifts suggested. Review and save.','उल्टो सिफ्ट सुझाव दिइयो। जाँचेर सुरक्षित गर्नुहोस्।','បានស្នើវេនផ្ទុយ។ សូមពិនិត្យ និងរក្សាទុក។','Naimungkahi ang baligtad na shift. Suriin at i-save.','Đã đề xuất đảo ca. Kiểm tra rồi lưu.'],
  copyPrevious: ['이전 명단 복사','Copy previous roster','अघिल्लो सूची कपी','ចម្លងបញ្ជីមុន','Kopyahin ang dati','Sao chép kỳ trước'],
  swap: ['주간 ↔ 야간 바꾸기','Swap day ↔ night','दिन ↔ रात बदल्नुहोस्','ប្ដូរវេនថ្ងៃ ↔ យប់','Palitan araw ↔ gabi','Đổi ca ngày ↔ đêm'],
  allDay: ['전체 주간','All day shift','सबै दिन','ទាំងអស់វេនថ្ងៃ','Lahat araw','Tất cả ca ngày'],
  allNight: ['전체 야간','All night shift','सबै रात','ទាំងអស់វេនយប់','Lahat gabi','Tất cả ca đêm'],
  saveCycle: ['2주 교대명단 저장','Save 2-week roster','२ हप्ता सूची सुरक्षित','រក្សាទុកបញ្ជីពីរសប្តាហ៍','I-save ang 2 linggo','Lưu phân ca 2 tuần'],
  noRoster: ['아직 이 기간의 교대명단이 없습니다.','No roster for this period.','यस अवधिको सूची छैन।','មិនទាន់មានបញ្ជីវេនសម្រាប់រយៈពេលនេះ។','Wala pang listahan para sa panahong ito.','Chưa có lịch phân ca trong kỳ này.'],
  saving: ['저장 중...','Saving...','सुरक्षित हुँदैछ...','កំពុងរក្សាទុក...','Sine-save...','Đang lưu...'],
  loginRequired: ['관리자 로그인이 필요합니다.','Admin login required.','प्रशासक लगइन आवश्यक।','ត្រូវការចូលគណនីអ្នកគ្រប់គ្រង។','Kailangan ang admin login.','Cần đăng nhập quản trị.'],
  missingPeople: ['전체 인원의 근무조를 지정해 주세요.','Assign a shift to every employee.','सबै कर्मचारीलाई सिफ्ट तोक्नुहोस्।','កំណត់វេនសម្រាប់បុគ្គលិកទាំងអស់។','Magtalaga ng shift sa lahat.','Hãy phân ca cho tất cả nhân viên.'],
  missingCheck: ['모든 직원의 출근 유형을 선택해 주세요.','Mark attendance for everyone.','सबैको उपस्थिति छान्नुहोस्।','កត់ត្រាវត្តមានសម្រាប់គ្រប់គ្នា។','Markahan ang lahat ng empleyado.','Hãy chấm công cho tất cả nhân viên.'],
  saved: ['저장되었습니다.','Saved.','सुरक्षित भयो।','បានរក្សាទុក។','Na-save na.','Đã lưu.'],
  published: ['출근표가 확정되었습니다.','Attendance confirmed.','उपस्थिति पुष्टि भयो।','បានបញ្ជាក់វត្តមាន។','Nakumpirma ang attendance.','Đã xác nhận chấm công.'],
  reopenDone: ['확정이 해제되었습니다.','Confirmation removed.','पुष्टि हटाइयो।','បានលុបការបញ្ជាក់។','Inalis ang kumpirmasyon.','Đã mở lại bảng chấm công.'],
  fail: ['처리 중 오류','Operation failed','प्रक्रियामा त्रुटि','ប្រតិបត្តិការបរាជ័យ','May error','Thao tác thất bại'],
  confirmDelete: ['이 공지를 삭제하시겠습니까?','Delete this notice?','यो सूचना मेटाउने?','លុបសេចក្តីជូនដំណឹងនេះ?','Burahin ang anunsyong ito?','Xóa thông báo này?'],
  confirmReopen: ['출근표 확정을 해제하시겠습니까?','Reopen this attendance sheet?','उपस्थिति पुनः खोल्ने?','បើកបញ្ជីវត្តមានឡើងវិញ?','Buksan muli ang attendance?','Mở lại bảng chấm công?'],
  retranslate: ['기존 공지 재번역','Retranslate notice','सूचना फेरि अनुवाद','បកប្រែសេចក្តីជូនដំណឹងឡើងវិញ','Isaling muli ang anunsyo','Dịch lại thông báo'],
  translationWorking: ['5개 외국어로 번역 중...','Translating into five languages...','पाँच भाषामा अनुवाद हुँदैछ...','កំពុងបកប្រែជា ៥ ភាសា...','Isinasalin sa limang wika...','Đang dịch sang 5 ngôn ngữ...'],
  translationNotice: ['AI 번역 후 6개 언어로 게시됩니다. 번역을 확인해 주세요.','AI translates notices into 6 languages. Please review translations.','AI ले ६ भाषामा अनुवाद गर्छ। कृपया जाँच्नुहोस्।','AI បកប្រែជា ៦ ភាសា។ សូមពិនិត្យ។','Isasalin ng AI sa 6 na wika. Pakisuri.','AI dịch sang 6 ngôn ngữ. Vui lòng kiểm tra.'],
  dateLocale: ['ko-KR','en-US','ne-NP','km-KH','en-PH','vi-VN'],
} as const;

export type Key = keyof typeof dict;
const codes: Lang[] = ['ko','en','ne','km','tl','vi'];
export function t(lang: Lang, key: Key): string {
  const i = codes.indexOf(lang);
  return dict[key][i] || dict[key][0];
}
export function formatDay(date: string, lang: Lang): string {
  if (!date) return '';
  const d = new Date(`${date}T12:00:00`);
  const weekdayKeys: Key[] = ['sun','mon','tue','wed','thu','fri','sat'];
  return `${date} (${t(lang,weekdayKeys[d.getDay()])})`;
}
export function localDate(date: Date) {
  return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
}
export function addDays(value: string, n: number) {
  const d = new Date(`${value}T12:00:00`);
  d.setDate(d.getDate()+n);
  return localDate(d);
}
export function monday(date: string) {
  const d = new Date(`${date}T12:00:00`);
  return addDays(date,-((d.getDay()+6)%7));
}
export const employees: Record<Team, {name:string;role:Role}[]> = {
  vacuum: [
    ...['정동훈','박지현','타라카','로니에르','트로이드','제프리','김민성','판반튜엔','황반뀌'].map(name=>({name,role:'operator' as Role})),
    ...['이윤숙','요코','아세리티','마죠리','백민정','후이판','프레카스','머니스','케삼','둑안','사우든','바오람','케사브','씅찬타','금호이','페아','키란','설태현','메세이','림부','기리라즈','강갑철','폰폴','준다라','천니','군금래잉','튼텅','바첸다'].map(name=>({name,role:'worker' as Role})),
  ],
  newmaterial:['김석희','박원식','강동효','주우팔','송규옥','장숙이','김현준','박세영','디팍싱','판넛','소팟','로타','비노드','김미숙','이은'].map(name=>({name,role:'worker' as Role})),
};
