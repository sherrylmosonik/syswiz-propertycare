// script.js — Ledger hostel management (in-memory data, no backend)

// ------------------------------------------------------------- seed data

let rooms = [
  { id: 'r101', number: '101', floor: 1, capacity: 4 },
  { id: 'r102', number: '102', floor: 1, capacity: 4 },
  { id: 'r103', number: '103', floor: 1, capacity: 2 },
  { id: 'r201', number: '201', floor: 2, capacity: 4 },
  { id: 'r202', number: '202', floor: 2, capacity: 4 },
  { id: 'r203', number: '203', floor: 2, capacity: 2 },
  { id: 'r301', number: '301', floor: 3, capacity: 4 },
  { id: 'r302', number: '302', floor: 3, capacity: 4 },
];

let students = [
  { id: 1, name: 'Amina Wanjiru', phone: '0712 345 001', roomId: 'r101', feeAmount: 8000, feePaid: true },
  { id: 2, name: 'Brian Otieno', phone: '0712 345 002', roomId: 'r101', feeAmount: 8000, feePaid: false },
  { id: 3, name: 'Grace Achieng', phone: '0712 345 003', roomId: 'r101', feeAmount: 8000, feePaid: true },
  { id: 4, name: 'Kevin Mwangi', phone: '0712 345 004', roomId: 'r102', feeAmount: 8000, feePaid: false },
  { id: 5, name: 'Faith Njeri', phone: '0712 345 005', roomId: 'r103', feeAmount: 7000, feePaid: true },
  { id: 6, name: 'Dennis Kiplagat', phone: '0712 345 006', roomId: 'r201', feeAmount: 8000, feePaid: true },
  { id: 7, name: 'Mercy Chebet', phone: '0712 345 007', roomId: 'r202', feeAmount: 8000, feePaid: false },
];

let complaints = [
  { id: 1, studentId: 2, text: 'Leaking tap in the shared bathroom', status: 'open' },
  { id: 2, studentId: 5, text: 'Window latch is broken', status: 'resolved' },
  { id: 3, studentId: 7, text: 'Room light keeps flickering', status: 'open' },
];

let nextStudentId = students.length + 1;
let nextComplaintId = complaints.length + 1;

// ------------------------------------------------------------- helpers

function occupantsOf(roomId) {
  return students.filter((s) => s.roomId === roomId);
}

function roomById(id) {
  return rooms.find((r) => r.id === id);
}

function studentById(id) {
  return students.find((s) => s.id === id);
}

function vacancyOf(room) {
  return room.capacity - occupantsOf(room.id).length;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// -------------------------------------------------------------- tabs

const tabs = document.querySelectorAll('.tab');
const views = document.querySelectorAll('.view');

function goTo(tabName) {
  tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === tabName));
  views.forEach((v) => v.classList.toggle('active', v.id === `view-${tabName}`));
}

tabs.forEach((tab) => tab.addEventListener('click', () => goTo(tab.dataset.tab)));
document.querySelectorAll('[data-goto]').forEach((btn) =>
  btn.addEventListener('click', () => goTo(btn.dataset.goto))
);

// --------------------------------------------------------- dashboard

function renderDashboard() {
  const totalBeds = rooms.reduce((sum, r) => sum + r.capacity, 0);
  const occupied = students.length;
  const vacant = totalBeds - occupied;
  const due = students.filter((s) => !s.feePaid).length;
  const openComplaints = complaints.filter((c) => c.status === 'open').length;

  document.getElementById('stat-rooms').textContent = rooms.length;
  document.getElementById('stat-occupied').textContent = occupied;
  document.getElementById('stat-vacant').textContent = vacant;
  document.getElementById('stat-due').textContent = due;
  document.getElementById('stat-complaints').textContent = openComplaints;

  // floor occupancy bars
  const floors = [...new Set(rooms.map((r) => r.floor))].sort();
  const floorBars = document.getElementById('floor-bars');
  floorBars.innerHTML = floors
    .map((floor) => {
      const floorRooms = rooms.filter((r) => r.floor === floor);
      const cap = floorRooms.reduce((sum, r) => sum + r.capacity, 0);
      const occ = floorRooms.reduce((sum, r) => sum + occupantsOf(r.id).length, 0);
      const pct = cap ? Math.round((occ / cap) * 100) : 0;
      return `
        <div class="floor-bar-row">
          <span class="floor-bar-label">Floor ${floor}</span>
          <div class="floor-bar-track"><div class="floor-bar-fill" style="width:${pct}%"></div></div>
          <span class="floor-bar-pct">${pct}%</span>
        </div>`;
    })
    .join('');

  // recent complaints (last 3, newest first)
  const recent = [...complaints].reverse().slice(0, 3);
  const recentList = document.getElementById('recent-complaints');
  recentList.innerHTML = recent.length
    ? recent
        .map((c) => {
          const student = studentById(c.studentId);
          const room = student ? roomById(student.roomId) : null;
          return `
            <li>
              ${escapeHtml(c.text)}
              <div class="mini-meta">${student ? escapeHtml(student.name) : 'Unknown'} &middot; Room ${room ? room.number : '—'} &middot; <span class="badge ${c.status}">${c.status}</span></div>
            </li>`;
        })
        .join('')
    : `<li class="mini-empty">No complaints logged yet.</li>`;
}

// -------------------------------------------------------------- rooms

function renderRooms() {
  const grid = document.getElementById('room-grid');
  grid.innerHTML = rooms
    .map((room) => {
      const occupants = occupantsOf(room.id);
      const vacancy = vacancyOf(room);
      const stateClass = vacancy === 0 ? 'full' : 'open';
      const dots = Array.from({ length: room.capacity })
        .map((_, i) => `<span class="bed-dot ${i < occupants.length ? 'filled' : ''}"></span>`)
        .join('');
      const occupantRows = occupants.length
        ? occupants.map((s) => `<li>${escapeHtml(s.name)}</li>`).join('')
        : `<li class="vacant-note">No residents yet</li>`;

      return `
        <div class="room-card ${stateClass}">
          <div class="room-number">${escapeHtml(room.number)}</div>
          <div class="room-floor">Floor ${room.floor} &middot; ${occupants.length}/${room.capacity} beds</div>
          <div class="bed-dots">${dots}</div>
          <ul class="room-occupants">${occupantRows}</ul>
        </div>`;
    })
    .join('');
}

// ----------------------------------------------------------- students

function populateRoomSelect() {
  const select = document.getElementById('s-room');
  const options = rooms
    .filter((r) => vacancyOf(r) > 0)
    .map((r) => `<option value="${r.id}">Room ${r.number} &middot; ${vacancyOf(r)} bed(s) open</option>`)
    .join('');
  select.innerHTML = options || `<option value="">No rooms with vacancy</option>`;
}

function populateComplaintStudentSelect() {
  const select = document.getElementById('c-student');
  select.innerHTML = students
    .map((s) => {
      const room = roomById(s.roomId);
      return `<option value="${s.id}">${escapeHtml(s.name)} — Room ${room ? room.number : '—'}</option>`;
    })
    .join('');
}

function renderStudents() {
  const tbody = document.getElementById('students-tbody');
  document.getElementById('student-count').textContent = `${students.length} residents`;

  tbody.innerHTML = students
    .map((s) => {
      const room = roomById(s.roomId);
      return `
        <tr>
          <td>${escapeHtml(s.name)}</td>
          <td>${room ? room.number : '—'}</td>
          <td>${escapeHtml(s.phone)}</td>
          <td><span class="badge ${s.feePaid ? 'paid' : 'due'}">${s.feePaid ? 'Paid' : 'Due'}</span></td>
          <td></td>
        </tr>`;
    })
    .join('');
}

function renderFees() {
  const tbody = document.getElementById('fees-tbody');
  tbody.innerHTML = students
    .map((s) => {
      const room = roomById(s.roomId);
      return `
        <tr>
          <td>${escapeHtml(s.name)}</td>
          <td>${room ? room.number : '—'}</td>
          <td>KES ${s.feeAmount.toLocaleString()}</td>
          <td><span class="badge ${s.feePaid ? 'paid' : 'due'}">${s.feePaid ? 'Paid' : 'Due'}</span></td>
          <td>${s.feePaid ? '' : `<button class="row-btn" data-mark-paid="${s.id}">Mark paid</button>`}</td>
        </tr>`;
    })
    .join('');

  tbody.querySelectorAll('[data-mark-paid]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const student = studentById(Number(btn.dataset.markPaid));
      if (student) student.feePaid = true;
      renderAll();
    });
  });
}

// --------------------------------------------------------- complaints

function renderComplaints() {
  document.getElementById('complaint-count').textContent = `${complaints.length} total`;
  const list = document.getElementById('complaint-list');

  list.innerHTML = [...complaints]
    .reverse()
    .map((c) => {
      const student = studentById(c.studentId);
      const room = student ? roomById(student.roomId) : null;
      return `
        <li class="complaint-item">
          <div class="complaint-main">
            <div class="complaint-text">${escapeHtml(c.text)}</div>
            <div class="complaint-meta">${student ? escapeHtml(student.name) : 'Unknown'} &middot; Room ${room ? room.number : '—'}</div>
          </div>
          <button class="row-btn" data-toggle-complaint="${c.id}">
            ${c.status === 'open' ? 'Mark resolved' : 'Reopen'}
          </button>
        </li>`;
    })
    .join('');

  list.querySelectorAll('[data-toggle-complaint]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const complaint = complaints.find((c) => c.id === Number(btn.dataset.toggleComplaint));
      if (complaint) complaint.status = complaint.status === 'open' ? 'resolved' : 'open';
      renderAll();
    });
  });
}

// -------------------------------------------------------------- forms

document.getElementById('student-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('s-name').value.trim();
  const phone = document.getElementById('s-phone').value.trim();
  const roomId = document.getElementById('s-room').value;
  const feeAmount = Number(document.getElementById('s-fee').value) || 0;
  const msg = document.getElementById('student-msg');

  if (!roomId) {
    msg.textContent = 'No room has a free bed right now — free one up first.';
    return;
  }

  students.push({ id: nextStudentId++, name, phone, roomId, feeAmount, feePaid: false });
  msg.textContent = '';
  e.target.reset();
  document.getElementById('s-fee').value = 8000;
  renderAll();
});

document.getElementById('complaint-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const studentId = Number(document.getElementById('c-student').value);
  const text = document.getElementById('c-text').value.trim();
  if (!studentId || !text) return;

  complaints.push({ id: nextComplaintId++, studentId, text, status: 'open' });
  e.target.reset();
  renderAll();
});

// --------------------------------------------------------------- init

function renderAll() {
  renderDashboard();
  renderRooms();
  populateRoomSelect();
  populateComplaintStudentSelect();
  renderStudents();
  renderFees();
  renderComplaints();
}

renderAll();