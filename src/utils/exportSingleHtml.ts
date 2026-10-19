import { ClassProStore } from '../types';

export function downloadStandaloneSingleHtml(store: ClassProStore): void {
  const currentClass = store.classes.find(c => c.id === store.currentClassId) || store.classes[0];
  const className = currentClass ? currentClass.name.replace(/[^a-zA-Z0-9_-]/g, '_') : '9_1';
  const serializedState = JSON.stringify(store).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

  const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CLASS PRO - Trợ Lý Giáo Viên Chủ Nhiệm (Offline)</title>
  <style>
    :root {
      --primary: #0d9488;
      --primary-dark: #0f766e;
      --primary-light: #ccfbf1;
      --text: #0f172a;
      --muted: #64748b;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --border: #e2e8f0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: var(--bg); color: var(--text); line-height: 1.5; padding: 20px; }
    .header { background: #fff; padding: 20px; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
    .title { font-size: 24px; font-weight: 700; color: var(--primary-dark); }
    .subtitle { font-size: 14px; color: var(--muted); margin-top: 4px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; background: var(--primary-light); color: var(--primary-dark); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 18px; }
    .card-title { font-size: 13px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .card-value { font-size: 28px; font-weight: 700; margin-top: 6px; color: var(--text); font-variant-numeric: tabular-nums; }
    .section-title { font-size: 18px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid var(--border); font-size: 14px; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border); }
    th { background: #f1f5f9; font-weight: 600; color: #475569; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #f8fafc; }
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: var(--primary); color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; }
    .btn:hover { background: var(--primary-dark); }
    .btn-outline { background: #fff; color: var(--text); border: 1px solid var(--border); }
    .btn-outline:hover { background: #f1f5f9; }
    .tabs { display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 8px; overflow-x: auto; }
    .tab-btn { padding: 8px 16px; border: 1px solid transparent; background: transparent; font-size: 14px; font-weight: 600; color: var(--muted); border-radius: 6px; cursor: pointer; }
    .tab-btn.active { background: var(--primary-light); color: var(--primary-dark); }
    .tab-pane { display: none; }
    .tab-pane.active { display: block; }
    .alert { padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; background: #e0f2fe; color: #0369a1; font-size: 14px; }
    @media print {
      body { padding: 0; background: #fff; }
      .no-print { display: none !important; }
      .card, table { border: 1px solid #000; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div style="display:flex; align-items:center; gap:10px;">
        <h1 class="title">CLASS PRO – Trợ Lý Giáo Viên Chủ Nhiệm</h1>
        <span class="badge">Bản Offline độc lập</span>
      </div>
      <p class="subtitle">Lớp: <strong>${currentClass ? currentClass.name : '9/1'}</strong> · Sĩ số: <strong>${store.students.length} học sinh</strong> · GVCN: <strong>${currentClass ? currentClass.teacherName : 'Cô Mai Anh'}</strong> · Năm học: <strong>${currentClass ? currentClass.schoolYear : '2024-2025'}</strong></p>
    </div>
    <div class="no-print" style="display:flex; gap:8px;">
      <button class="btn" onclick="window.print()">In trang này</button>
      <button class="btn btn-outline" onclick="exportDataJson()">Xuất dữ liệu JSON</button>
    </div>
  </div>

  <div class="alert no-print">
    Đây là file HTML đơn lẻ lưu trữ độc lập. Quý thầy cô có thể mở trên mọi trình duyệt mà không cần mạng Internet. Dữ liệu đã được nạp sẵn từ lần xuất gần nhất.
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-title">Sĩ số học sinh</div>
      <div class="card-value">${store.students.length}</div>
    </div>
    <div class="card">
      <div class="card-title">Số tổ học tập</div>
      <div class="card-value">${store.teams ? store.teams.length : 4}</div>
    </div>
    <div class="card">
      <div class="card-title">Sự kiện thi đua</div>
      <div class="card-value">${store.competitionEvents ? store.competitionEvents.length : 0}</div>
    </div>
    <div class="card">
      <div class="card-title">Giao dịch Quỹ lớp</div>
      <div class="card-value">${store.financeTransactions ? store.financeTransactions.length : 0}</div>
    </div>
  </div>

  <div class="no-print tabs">
    <button class="tab-btn active" onclick="switchTab('students')">Danh sách Học sinh</button>
    <button class="tab-btn" onclick="switchTab('competition')">Thi đua & Điểm rèn luyện</button>
    <button class="tab-btn" onclick="switchTab('announcements')">Thông báo & Nhận xét</button>
    <button class="tab-btn" onclick="switchTab('timetable')">Thời khóa biểu</button>
  </div>

  <div id="tab-students" class="tab-pane active">
    <div class="section-title">
      <span>Danh sách học sinh (${store.students.length} em)</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>STT</th>
          <th>Mã HS</th>
          <th>Họ và tên</th>
          <th>Ngày sinh</th>
          <th>Giới tính</th>
          <th>Tổ</th>
          <th>Chức vụ</th>
          <th>Điểm thi đua</th>
          <th>Số xu</th>
        </tr>
      </thead>
      <tbody>
        ${store.students.map((s, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${s.code}</strong></td>
            <td>${s.fullName}</td>
            <td>${s.dob || '—'}</td>
            <td>${s.gender}</td>
            <td>Tổ ${s.teamNumber}</td>
            <td>${s.role}</td>
            <td><strong>${s.points}</strong></td>
            <td>${s.coins}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div id="tab-competition" class="tab-pane">
    <div class="section-title">
      <span>Lịch sử ghi nhận thi đua (${store.competitionEvents ? store.competitionEvents.length : 0} sự kiện)</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>Ngày</th>
          <th>Đối tượng</th>
          <th>Tên</th>
          <th>Tiêu chí</th>
          <th>Điểm</th>
          <th>Minh chứng / Ghi chú</th>
        </tr>
      </thead>
      <tbody>
        ${(store.competitionEvents || []).map(ev => `
          <tr>
            <td>${ev.date}</td>
            <td>${ev.targetType === 'individual' ? 'Cá nhân' : ev.targetType === 'team' ? 'Tổ' : 'Cả lớp'}</td>
            <td><strong>${ev.targetName}</strong></td>
            <td>${ev.criterionName}</td>
            <td style="color:${ev.points >= 0 ? '#059669' : '#dc2626'}; font-weight:700;">${ev.points > 0 ? `+${ev.points}` : ev.points}</td>
            <td>${ev.note || '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div id="tab-announcements" class="tab-pane">
    <div class="section-title">
      <span>Thông báo chung</span>
    </div>
    ${(store.announcements || []).map(ann => `
      <div class="card" style="margin-bottom:12px;">
        <div style="font-weight:700; font-size:16px;">${ann.title}</div>
        <div style="font-size:12px; color:var(--muted); margin-bottom:8px;">Ngày: ${ann.date}</div>
        <div style="font-size:14px;">${ann.content}</div>
      </div>
    `).join('')}
  </div>

  <div id="tab-timetable" class="tab-pane">
    <div class="section-title">
      <span>Thời khóa biểu các ngày trong tuần</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>Thứ</th>
          <th>Buổi</th>
          <th>Tiết 1</th>
          <th>Tiết 2</th>
          <th>Tiết 3</th>
          <th>Tiết 4</th>
          <th>Tiết 5</th>
        </tr>
      </thead>
      <tbody>
        ${(store.timetable || []).map(day => {
          const dayName = day.dayOfWeek === 7 ? 'Thứ 7' : 'Thứ ' + day.dayOfWeek;
          const m1 = day.morning.find(p => p.period === 1)?.subject || '—';
          const m2 = day.morning.find(p => p.period === 2)?.subject || '—';
          const m3 = day.morning.find(p => p.period === 3)?.subject || '—';
          const m4 = day.morning.find(p => p.period === 4)?.subject || '—';
          const m5 = day.morning.find(p => p.period === 5)?.subject || '—';
          return `
            <tr>
              <td><strong>${dayName}</strong></td>
              <td>Sáng</td>
              <td>${m1}</td>
              <td>${m2}</td>
              <td>${m3}</td>
              <td>${m4}</td>
              <td>${m5}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  </div>

  <script>
    const appData = ${serializedState};
    function switchTab(tabId) {
      document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
      document.getElementById('tab-' + tabId).classList.add('active');
      event.target.classList.add('active');
    }
    function exportDataJson() {
      const blob = new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'DuLieuClassPro_' + new Date().toISOString().split('T')[0] + '.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ClassPro_Lop_${className}_Offline.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
