import type {Lang} from './i18n';
const v3={
 removed:{ko:'명단 제외',en:'Remove from roster',ne:'सूचीबाट हटाउनुहोस्',km:'ដកចេញពីបញ្ជី',tl:'Alisin sa listahan',vi:'Xóa khỏi danh sách'},
 inactive:{ko:'비활성 직원 포함',en:'Show inactive staff',ne:'निष्क्रिय कर्मचारी पनि',km:'បង្ហាញបុគ្គលិកអសកម្ម',tl:'Isama ang inactive',vi:'Hiển thị nhân viên ngừng hoạt động'},
 rankEmpty:{ko:'직급 미지정',en:'Rank not assigned',ne:'पद नतोकिएको',km:'មិនទាន់កំណត់តួនាទី',tl:'Walang ranggo',vi:'Chưa có cấp bậc'},
 rankLegacy:{ko:'기존 직급 (변경 필요)',en:'Previous rank (review)',ne:'पुरानो पद (जाँच)',km:'តួនាទីចាស់ (ពិនិត្យ)',tl:'Dating ranggo (suriin)',vi:'Cấp bậc cũ (xem lại)'},
 employeeReason:{ko:'직원 제외 사유를 입력하세요. (퇴사/부서이동/기타)',en:'Reason (resignation/transfer/other)',ne:'हटाउनुको कारण लेख्नुहोस्',km:'បញ្ចូលហេតុផលដកចេញ',tl:'Dahilan ng pagtanggal',vi:'Nhập lý do loại khỏi danh sách'},
 memberConfirm:{ko:'직원을 현재 명단에서 제외하고 로그인을 차단합니다. 과거 기록은 보존합니다. 진행할까요?',en:'Remove staff from active rosters and block login? Historical records remain.',ne:'वर्तमान सूचीबाट हटाई लगइन रोक्ने? पुराना रेकर्ड रहन्छन्।',km:'ដកចេញពីបញ្ជីនិងបិទការចូល? រក្សាទុកប្រវត្តិ។',tl:'Alisin sa aktibong listahan at pigilan ang login? Mananatili ang history.',vi:'Loại khỏi danh sách hiện tại và chặn đăng nhập? Giữ lịch sử.'},
 bulk:{ko:'시간 일괄 적용',en:'Bulk time update',ne:'समय सामूहिक रूपमा बदल्नुहोस्',km:'ប្តូរម៉ោងជាក្រុម',tl:'Sabayang oras',vi:'Áp dụng giờ hàng loạt'},
 chosen:{ko:'명 선택',en:'selected',ne:'छनोट',km:'បានជ្រើស',tl:'napili',vi:'đã chọn'},
 column:{ko:'변경 항목',en:'Field',ne:'क्षेत्र',km:'ប្រភេទ',tl:'Field',vi:'Trường'},
 time:{ko:'시간',en:'Time',ne:'समय',km:'ម៉ោង',tl:'Oras',vi:'Giờ'},
 apply:{ko:'선택 직원 적용',en:'Apply to selected',ne:'छनोटमा लागू',km:'អនុវត្តលើអ្នកដែលបានជ្រើស',tl:'Ilapat sa napili',vi:'Áp dụng cho đã chọn'},
 selectAll:{ko:'현재 목록 전체 선택',en:'Select visible staff',ne:'देखिने सबै छान्नुहोस्',km:'ជ្រើសទាំងអស់',tl:'Piliin lahat',vi:'Chọn tất cả đang hiển thị'},
 clear:{ko:'선택 해제',en:'Clear selection',ne:'छनोट हटाउनुहोस्',km:'ដកការជ្រើស',tl:'Alisin ang pagpili',vi:'Bỏ chọn'},
 prevStart:{ko:'전일 확정 출근',en:'Previous actual start',ne:'अघिल्लो वास्तविक सुरु',km:'ចូលម្សិលមិញ',tl:'Dating aktuwal na pasok',vi:'Giờ vào hôm trước'},
 prevEnd:{ko:'전일 확정 퇴근',en:'Previous actual end',ne:'अघिल्लो वास्तविक अन्त्य',km:'ចេញម្សិលមិញ',tl:'Dating aktuwal na uwi',vi:'Giờ ra hôm trước'},
 plannedStart:{ko:'당일 예정 출근',en:'Today planned start',ne:'आजको योजना सुरु',km:'ចូលតាមផែនការ',tl:'Planong pasok ngayon',vi:'Dự kiến vào hôm nay'},
 plannedEnd:{ko:'당일 예정 퇴근',en:'Today planned end',ne:'आजको योजना अन्त्य',km:'ចេញតាមផែនការ',tl:'Planong uwi ngayon',vi:'Dự kiến ra hôm nay'},
 custom:{ko:'직접 입력',en:'Manual entry',ne:'आफैं लेख्नुहोस्',km:'បញ្ចូលដោយដៃ',tl:'Manwal na input',vi:'Nhập thủ công'},
 saveHint:{ko:'적용 후 저장을 누르세요. 전일 확정·당일 예정은 분리됩니다.',en:'Save after applying. Previous actual and today planned times stay separate.',ne:'लागू गरेपछि सुरक्षित गर्नुहोस्।',km:'អនុវត្តរួចរក្សាទុក។',tl:'I-save pagkatapos ilapat.',vi:'Lưu sau khi áp dụng.'},
 noAccess:{ko:'활성 직원이 아닙니다. 관리자에게 문의하세요.',en:'This employee account is inactive. Contact an administrator.',ne:'कर्मचारी खाता निष्क्रिय छ।',km:'គណនីបុគ្គលិកមិនដំណើរការ',tl:'Hindi aktibo ang account.',vi:'Tài khoản nhân viên không hoạt động.'}
} satisfies Record<string,Record<Lang,string>>;
export const v3t=(lang:Lang,key:keyof typeof v3)=>v3[key][lang];
