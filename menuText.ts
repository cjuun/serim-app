import type {Lang} from './i18n';
export type MenuKey='dashboard'|'mySchedule'|'attendanceGroup'|'production'|'education'|'quality'|'system'|'operations'|'notice'|'calendar'|'myAttendance'|'myLeave'|'myClaims'|'attendance'|'shift'|'organization'|'productionStatus'|'inventory'|'machines'|'tbm'|'risk'|'claims'|'settings'|'staffadmin'|'dailyreport'|'breaks'|'access'|'staffportal';
const labels:Record<MenuKey,Record<Lang,string>>={
 dashboard:{ko:'대시보드',en:'Dashboard',ne:'ड्यासबोर्ड',km:'ផ្ទាំងគ្រប់គ្រង',tl:'Dashboard',vi:'Bảng điều khiển'},
 mySchedule:{ko:'나의 일정',en:'My schedule',ne:'मेरो तालिका',km:'កាលវិភាគរបស់ខ្ញុំ',tl:'Aking iskedyul',vi:'Lịch của tôi'},
 attendanceGroup:{ko:'근태',en:'Attendance',ne:'हाजिरी',km:'វត្តមាន',tl:'Pagpasok',vi:'Chấm công'},
 production:{ko:'생산',en:'Production',ne:'उत्पादन',km:'ផលិតកម្ម',tl:'Produksyon',vi:'Sản xuất'},
 education:{ko:'교육',en:'Training',ne:'तालिम',km:'បណ្តុះបណ្តាល',tl:'Pagsasanay',vi:'Đào tạo'},
 quality:{ko:'품질',en:'Quality',ne:'गुणस्तर',km:'គុណភាព',tl:'Kalidad',vi:'Chất lượng'},
 system:{ko:'시스템 관리',en:'System management',ne:'प्रणाली व्यवस्थापन',km:'គ្រប់គ្រងប្រព័ន្ធ',tl:'Sistema',vi:'Quản lý hệ thống'},
 operations:{ko:'관리 및 자동화운영',en:'Operations & automation',ne:'सञ्चालन र स्वचालन',km:'ការគ្រប់គ្រង និងស្វ័យប្រវត្តិកម្ម',tl:'Pamamahala at automation',vi:'Quản lý & tự động hóa'},
 notice:{ko:'공지사항',en:'Notices',ne:'सूचनाहरू',km:'សេចក្តីជូនដំណឹង',tl:'Mga abiso',vi:'Thông báo'},
 calendar:{ko:'캘린더',en:'Calendar',ne:'पात्रो',km:'ប្រតិទិន',tl:'Kalendaryo',vi:'Lịch'},
 myAttendance:{ko:'출석',en:'Attendance',ne:'हाजिरी',km:'វត្តមាន',tl:'Pagpasok',vi:'Đi làm'},
 myLeave:{ko:'근태신청 현황',en:'My leave requests',ne:'बिदा आवेदन',km:'សំណើឈប់សម្រាក',tl:'Mga leave request',vi:'Đơn nghỉ phép'},
 myClaims:{ko:'고객클레임 발생',en:'Assigned claims',ne:'ग्राहक उजुरी',km:'បណ្ដឹងអតិថិជន',tl:'Mga reklamo',vi:'Khiếu nại liên quan'},
 attendance:{ko:'출석체크',en:'Attendance check',ne:'हाजिरी जाँच',km:'ពិនិត្យវត្តមាន',tl:'Attendance check',vi:'Kiểm tra chấm công'},
 shift:{ko:'주/야 교대명단',en:'Day/Night roster',ne:'दिन/रात सिफ्ट',km:'បញ្ជីវេន',tl:'Listahan ng shift',vi:'Danh sách ca'},
 organization:{ko:'조직도',en:'Organization chart',ne:'सङ्गठन चार्ट',km:'រចនាសម្ព័ន្ធ',tl:'Organisasyon',vi:'Sơ đồ tổ chức'},
 productionStatus:{ko:'생산현황',en:'Production status',ne:'उत्पादन स्थिति',km:'ស្ថានភាពផលិតកម្ម',tl:'Kalagayan ng produksyon',vi:'Tình hình sản xuất'},
 inventory:{ko:'재고관리',en:'Inventory',ne:'भण्डार',km:'ស្តុក',tl:'Imbentaryo',vi:'Quản lý tồn kho'},
 machines:{ko:'설비현황',en:'Equipment status',ne:'मेसिन स्थिति',km:'ស្ថានភាពម៉ាស៊ីន',tl:'Katayuan ng makina',vi:'Tình trạng thiết bị'},
 tbm:{ko:'TBM 활동',en:'TBM activities',ne:'TBM गतिविधि',km:'សកម្មភាព TBM',tl:'Aktibidad ng TBM',vi:'Hoạt động TBM'},
 risk:{ko:'위험성 평가',en:'Risk assessment',ne:'जोखिम मूल्यांकन',km:'វាយតម្លៃហានិភ័យ',tl:'Pagtatasa ng panganib',vi:'Đánh giá rủi ro'},
 claims:{ko:'고객사 클레임',en:'Customer claims',ne:'ग्राहक उजुरी',km:'បណ្ដឹងអតិថិជន',tl:'Reklamo ng customer',vi:'Khiếu nại khách hàng'},
 settings:{ko:'환경설정',en:'Settings',ne:'सेटिङ',km:'ការកំណត់',tl:'Mga setting',vi:'Cài đặt'},
 staffadmin:{ko:'직원 신청관리',en:'Employee management',ne:'कर्मचारी व्यवस्थापन',km:'គ្រប់គ្រងបុគ្គលិក',tl:'Pamamahala ng empleyado',vi:'Quản lý nhân viên'},
 dailyreport:{ko:'일일 근태보고서',en:'Daily attendance report',ne:'दैनिक हाजिरी रिपोर्ट',km:'របាយការណ៍វត្តមាន',tl:'Arawang ulat',vi:'Báo cáo chấm công'},
 breaks:{ko:'휴게시간 관리',en:'Break-time management',ne:'विश्राम व्यवस्थापन',km:'គ្រប់គ្រងពេលសម្រាក',tl:'Pamamahala ng pahinga',vi:'Quản lý giờ nghỉ'},
 access:{ko:'사용자 권한 관리',en:'User access',ne:'प्रयोगकर्ता अधिकार',km:'សិទ្ធិអ្នកប្រើប្រាស់',tl:'Pahintulot ng user',vi:'Phân quyền'},
 staffportal:{ko:'직원 서비스',en:'Employee services',ne:'कर्मचारी सेवा',km:'សេវាបុគ្គលិក',tl:'Serbisyo ng empleyado',vi:'Dịch vụ nhân viên'}
};
export function menuText(lang:Lang,key:MenuKey){return labels[key][lang];}
