// ========== STANDARD USER LOGIN - TOP RIGHT BAR, NO POPUP ==========

document.getElementById("signinBtn").onclick = async function () {
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();

    if (!user || !pass) {
        alert("Please enter username and password.");
        return;
    }

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userID: user, password: pass })
        });
        const data = await res.json();

        if (data.success) {
            window._userLoggedIn = true;
            window._userAccess = data.user; // All permissions etc.
            setTabsBasedOnPermissions(data.user);
            document.getElementById("signoutBtn").style.display = "";
            document.getElementById("signinBtn").style.display = "none";
            document.getElementById("username").disabled = true;
            document.getElementById("password").disabled = true;
            alert("Login successful!");
        } else {
            alert("Invalid username or password.");
        }
    } catch (err) {
        alert("Login error! Server might be down.");
        console.error(err);
    }
};



// Support Enter key for login from either field:
["username", "password"].forEach(id => {
    document.getElementById(id).addEventListener("keyup", function(e) {
        if (e.key === "Enter") document.getElementById("signinBtn").click();
    });
});

// Sign Out logic
function signOut() {
    window._userLoggedIn = false;
    window._userAccess = null;
    document.getElementById("signoutBtn").style.display = "none";
    document.getElementById("signinBtn").style.display = "";
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.getElementById("username").disabled = false;
    document.getElementById("password").disabled = false;
    // Optionally hide tabs or return to home/dashboard here
}
document.getElementById("signoutBtn").onclick = signOut;


// --------- TAB ACCESS CONTROL (unchanged) ---------





function parseDate(dtStr) {
  if (!dtStr) return null;
  // Try ISO
  const iso = Date.parse(dtStr);
  if (!isNaN(iso)) return new Date(iso);

  // Try legacy "hh:mm:ss AM/PM"
  let date = new Date();
  let [time, meridian] = dtStr.split(' ');
  if (!time) return null;
  let [h, m, s] = time.split(':').map(Number);
  if (meridian && meridian.toUpperCase() === 'PM' && h < 12) h += 12;
  if (meridian && meridian.toUpperCase() === 'AM' && h === 12) h = 0;
  date.setHours(h || 0, m || 0, s || 0, 0);
  return date;
}



// ---------- GLOBAL STATE -----------
window._userLoggedIn = false;
window._userAccess = null;   // holds user object if logged in
window._adminLoggedIn = false;

// Ensure admin user exists in storage
// REPLACE your ensureAdminUser() with this server-based async version
async function ensureAdminUser() {
  try {
    // Try to fetch admin user from server
    const res = await fetch('/api/users/admin');
    if (res.status === 404) {
      // Admin does not exist, so create it
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userID: 'admin',
          designation: 'Administrator',
          password: 'admin',
          TimeEntryView: true,
          TimeEntryEdit: true,
          TimeRecordsView: true,
          TimeRecordsExport: true,
          WOListSearch: true,
          WOListImport: true
        })
      });
    }
  } catch (err) {
    console.error("Failed to ensure admin user on server:", err);
  }
}
// Call after DOMContentLoaded or at app startup
ensureAdminUser();



// ---------- UI HELPERS -----------
function showOnlySection(sectionId) {
  document.querySelectorAll('.view-section').forEach(view => view.classList.add('hidden'));
  document.getElementById(sectionId).classList.remove('hidden');
}

// ---------- LOGIN POPUPS -----------


function showAdminLoginPopup(afterLoginCallback) {
  let modal = document.getElementById("adminLoginModal");
  if (!modal) {
    modal = document.createElement('div');
    modal.id = "adminLoginModal";
    modal.innerHTML = `
      <div class="modal-content">
        <h3>Admin Login</h3>
        <input id="adminLoginUser" placeholder="Username" value=""><br>
        <input id="adminLoginPass" type="password" placeholder="Password" value=""><br>
        <div id="adminLoginError" style="color:red;"></div>
        <button id="adminLoginBtn">Sign In</button>
        <button onclick="document.getElementById('adminLoginModal').style.display='none'">Cancel</button>
      </div>
    `;
    modal.style = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,.2);z-index:999;display:flex;align-items:center;justify-content:center;';
    document.body.appendChild(modal);
    modal.querySelector('#adminLoginBtn').onclick = function() {
      doAdminLogin(afterLoginCallback);
    }
  }
  modal.style.display = 'flex';
  modal.querySelector('#adminLoginUser').value = '';
  modal.querySelector('#adminLoginPass').value = '';
  modal.querySelector('#adminLoginError').textContent = '';
  modal.querySelector('#adminLoginPass').onkeyup = function(e) {
    if (e.key === "Enter") doAdminLogin(afterLoginCallback);
  };
}

// Show User Login Modal Popup





// ---------- ADMIN LOGIN FUNCTION ----------
function doAdminLogin(afterLoginCallback) {
  const user = document.getElementById('adminLoginUser').value.trim();
  const pass = document.getElementById('adminLoginPass').value.trim();
  if (user === "admin" && pass === "admin") {
    window._adminLoggedIn = true;
    window._userLoggedIn = true;
    window._userAccess = {
      userID: "admin",
      designation: "Administrator",
      password: "admin",
      TimeEntryView: true,
      TimeEntryEdit: true,
      TimeRecordsView: true,
      TimeRecordsExport: true,
      WOListSearch: true,
      WOListImport: true
    };
    document.getElementById("adminLoginModal").style.display = "none";
    setTabsBasedOnPermissions(window._userAccess);
    showOnlySection("adminView");
    loadAdminRightsTable();
    if (typeof afterLoginCallback === "function") afterLoginCallback();
  } else {
    document.getElementById("adminLoginError").textContent = "Invalid admin credentials";
  }
}

// --------- TAB ACCESS CONTROL ---------
// ---- SHOW SECTIONS BASED ON USER/ADMIN ----
function setTabsBasedOnPermissions(user) {
  // Hide all tabs first
  ["timeFormView","recordsView","woView","adminView"].forEach(id => {
    let tab = document.querySelector(`[data-target='${id}']`);
    if (tab) tab.style.display = "none";
  });

  // Show tabs as allowed
  if (user.TimeEntryView || user.TimeEntryEdit) {
    let tab = document.querySelector(`[data-target='timeFormView']`);
    if (tab) tab.style.display = "";
  }
  if (user.TimeRecordsView || user.TimeRecordsExport) {
    let tab = document.querySelector(`[data-target='recordsView']`);
    if (tab) tab.style.display = "";
  }
  if (user.WOListSearch || user.WOListImport) {
    let tab = document.querySelector(`[data-target='woView']`);
    if (tab) tab.style.display = "";
  }
  // Admin tab only for admin
  if (user.userID === "admin") {
    let tab = document.querySelector(`[data-target='adminView']`);
    if (tab) tab.style.display = "";
  }

  // Show/hide the Import WO Data area in WO List based on user access
  const importArea = document.getElementById('importWOArea');
  // 👉 DEBUG LOG: see what's going on every time
  console.log('importWOArea:', importArea, 'WOListImport:', user.WOListImport, 'user:', user);

  if (importArea) {
    if (user.WOListImport) {
      importArea.style.display = '';
    } else {
      importArea.style.display = 'none';
    }
  }
}


// ----------- TAB CLICK HANDLERS -----------


function handleAdminLogin() {
  const user = document.getElementById('adminLoginUser').value.trim();
  const pass = document.getElementById('adminLoginPass').value.trim();
  if (user === 'admin' && pass === 'admin') {
    // Allow admin access for this session
    window._adminLoggedIn = true;
    document.getElementById('adminLoginModal').style.display = 'none';
    showOnlySection('adminView');
    loadAdminRightsTable();
  } else {
    document.getElementById('adminLoginError').textContent = 'Invalid admin credentials';
  }
}


// --------- ADMIN TABLE (ALREADY IN YOUR CODE) ----------
// ... leave your loadAdminRightsTable, addAdminUser, deleteAdminUser etc. as before ...


// Permission keys (same as your table checkboxes)
const adminPermissionKeys = [
  'TimeEntryView', 'TimeEntryEdit', 'TimeRecordsView', 'TimeRecordsExport', 'WOListSearch', 'WOListImport'
];

// Load and show admin users from storage
// REPLACE the entire function with this
async function loadAdminRightsTable() {
  const tbody = document.querySelector("#adminRightsTable tbody");
  tbody.innerHTML = '';
  // Fetch users from the server, not localStorage!
  let users = [];
  try {
    const res = await fetch('/api/users'); // Or your actual endpoint for user list
    users = await res.json();
  } catch (err) {
    alert("Failed to load users from server.");
    return;
  }
  users.forEach((user, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${user.userID}</td>
      <td>${user.designation}</td>
      <td><input type="password" value="${user.password}" disabled /></td>
      ${adminPermissionKeys.map(k =>
        `<td><input type="checkbox" ${user[k] ? 'checked' : ''} disabled /></td>`
      ).join('')}
      <td><button onclick="deleteAdminUser('${user.userID}')">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });
}


// REPLACE the entire function with this
async function addAdminUser() {
  const userID = document.getElementById("addUserID").value.trim();
  const designation = document.getElementById("addDesignation").value.trim();
  const password = document.getElementById("addPassword").value.trim();
  if (!userID || !password) return alert("User ID and Password required!");

  const user = {
    userID,
    designation,
    password,
    TimeEntryView: document.getElementById("addV1").checked,
    TimeEntryEdit: document.getElementById("addV2").checked,
    TimeRecordsView: document.getElementById("addV3").checked,
    TimeRecordsExport: document.getElementById("addV4").checked,
    WOListSearch: document.getElementById("addV5").checked,
    WOListImport: document.getElementById("addV6").checked
  };

  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    if (!res.ok) throw new Error("Add user failed");
  } catch (err) {
    alert("Failed to add user to server.");
    return;
  }

  // Clear inputs
  ["addUserID", "addDesignation", "addPassword", "addV1", "addV2", "addV3", "addV4", "addV5", "addV6"].forEach(id => {
    const el = document.getElementById(id);
    if (el.type === "checkbox") el.checked = false; else el.value = "";
  });
  await loadAdminRightsTable();
}


// REPLACE the entire function with this
async function deleteAdminUser(userID) {
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(userID)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error("Delete failed");
  } catch (err) {
    alert("Failed to delete user from server.");
    return;
  }
  await loadAdminRightsTable();
}


// On page load (or after admin login), show users
document.addEventListener("DOMContentLoaded", async () => {
  await loadTimeRecordsFromServer();
  populateTimeRecordsTable();
  ["timeFormView","recordsView","woView","adminView"].forEach(id => {
    let tab = document.querySelector(`[data-target='${id}']`);
    if (tab) tab.style.display = "none";
  });

  document.querySelectorAll('.view-section').forEach(v => v.classList.add('hidden'));
  if (document.getElementById('homeView')) {
    document.getElementById('homeView').classList.remove('hidden');
  }

  // ========== LOGIN HANDLER ==========
  const signinBtn = document.getElementById("signinBtn");
  if (signinBtn) {
    signinBtn.onclick = async function () {
      const user = document.getElementById("username").value.trim();
      const pass = document.getElementById("password").value.trim();

      if (!user || !pass) {
        alert("Please enter username and password.");
        return;
      }

      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userID: user, password: pass })
        });
        const data = await res.json();

        if (data.success) {
          window._userLoggedIn = true;
          window._userAccess = data.user; // All permissions etc.
          setTabsBasedOnPermissions(data.user);
          document.getElementById("signoutBtn").style.display = "";
          document.getElementById("signinBtn").style.display = "none";
          document.getElementById("username").disabled = true;
          document.getElementById("password").disabled = true;
          alert("Login successful!");
        } else {
          alert("Invalid username or password.");
        }
      } catch (err) {
        alert("Login error! Server might be down.");
        console.error(err);
      }
    };
  }

  // 3. Navigation: switch views on click
  const navItems = document.querySelectorAll(".nav-item");
  if (navItems.length) {
    navItems.forEach(item => {
      item.addEventListener("click", function() {
        document.querySelectorAll('.view-section').forEach(v => v.classList.add('hidden'));
        const viewId = this.getAttribute("data-target");
        const section = document.getElementById(viewId);
        if (section) section.classList.remove('hidden');
        if (viewId === "woView" && typeof loadWOsFromLocalStorage === "function") loadWOsFromLocalStorage();
        if (viewId === "recordsView" && typeof loadTimeRecords === "function") loadTimeRecords();
        if (viewId === "homeView" && typeof refreshDashboard === "function") refreshDashboard();
        if (viewId === "adminView" && typeof loadAdminRightsTable === "function") loadAdminRightsTable();
      });
    });
  }

  if (window._adminLoggedIn && typeof loadAdminRightsTable === "function") {
    loadAdminRightsTable();
  }
});



function showSignOutButton() {
  document.getElementById("signoutBtn").style.display = "";
  document.getElementById("signinBtn").style.display = "none";
}


function signOut() {
  window._adminLoggedIn = false;
  window._userAccess = null;
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  // Enable the fields for next login!
  document.getElementById("username").disabled = false;
  document.getElementById("password").disabled = false;
  // If you use a login bar wrapper, ensure it's visible
  if (document.getElementById("loginBar")) {
    document.getElementById("loginBar").style.display = "";
  }
  document.getElementById("signinBtn").style.display = "";
  document.getElementById("signoutBtn").style.display = "none";
  // Show only home
  document.querySelectorAll('.view-section').forEach(v => v.classList.add('hidden'));
  document.getElementById('homeView').classList.remove('hidden');
  // Optionally hide tabs
  ["timeFormView","recordsView","woView","adminView"].forEach(id => {
    let tab = document.querySelector(`[data-target='${id}']`);
    if (tab) tab.style.display = "none";
  });
  // Hide Import WO Data area on signout
  const importArea = document.getElementById('importWOArea');
  if (importArea) importArea.style.display = 'none';
}


document.getElementById("signoutBtn").onclick = signOut;


// Show sign out when logged in
function showSignOutButton() {
  document.getElementById("signoutBtn").style.display = "";
  document.getElementById("signinBtn").style.display = "none";
}


  // ✅ Optional: Load WO data immediately if WO tab is default visible
  const woView = document.getElementById("woView");
  if (!woView.classList.contains("hidden")) {
    loadWOsFromLocalStorage();
    populateTimeEntrySummaryTable(); // <--- ADD THIS LINE!
  }

  // --- ADD THIS FOR ALL CASES, NOT JUST WO TAB ---
  populateTimeEntrySummaryTable(); // This will always show the last 20 summary records on page load


function handleWOImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  const extension = file.name.split('.').pop().toLowerCase();

  if (extension === 'csv') {
    reader.onload = function (e) {
      const text = e.target.result;
      const rows = text.trim().split('\n').map(row => row.split(','));
      const headers = rows[0];
      const data = rows.slice(1).map(row => {
        let obj = {};
        headers.forEach((h, i) => {
          obj[h.trim()] = row[i]?.trim();
        });
        return obj;
      });
      populateWOTable(data);
    };
    reader.readAsText(file);
  } else if (extension === 'xlsx') {
    reader.onload = function (e) {
      const workbook = XLSX.read(e.target.result, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      populateWOTable(json);
    };
    reader.readAsBinaryString(file);
  } else {
    alert('Only CSV and XLSX supported');
  }
}


async function populateWOTable(data) {
  const tbody = document.querySelector('#woListTable tbody');

  for (const row of data) {
    const wono = row['WONO']?.trim();
    if (!wono || woDataStore.some(existing => existing['WONO'] === wono)) continue;

    const formattedDate = formatDateToDDMMMYYYY(row['DEMANDDATE']);
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td><input type="checkbox" class="wo-checkbox" data-wono="${wono}"></td>
      <td>${wono}</td>
      <td>${row['PARTNO'] || ''}</td>
      <td>${row['Description'] || ''}</td>
      <td>${row['WOQTY'] || ''}</td>
      <td>${formattedDate}</td>
      <td><span class="barcode">${wono}</span></td>
      <td><button onclick="deleteRow(this)">Delete</button></td>
    `;

    tbody.appendChild(tr);
    woDataStore.push({ ...row, DEMANDDATE: formattedDate });

    // Save the new WO entry to the server for each new WO
    await fetch('/api/woList', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...row, DEMANDDATE: formattedDate })
    });
  }
}



function filterWOList() {
    const demandFrom = document.getElementById("demandFrom").value;
    const demandTo = document.getElementById("demandTo").value;
    const searchWONO = document.getElementById("searchWONO").value.trim().toLowerCase();
    const searchPARTNO = document.getElementById("searchPARTNO").value.trim().toLowerCase();

    const table = document.getElementById("woListTable");
    const rows = table.querySelectorAll("tbody tr");

    // Find DEMANDDATE column index (dynamic, for safety)
    let demandDateIdx = -1, partnoIdx = -1, wonoIdx = -1;
    const headerCells = table.querySelectorAll("thead th");
    headerCells.forEach((th, idx) => {
      const h = th.textContent.trim().toLowerCase();
      if (h === 'demanddate') demandDateIdx = idx;
      if (h === 'partno') partnoIdx = idx;
      if (h === 'wono') wonoIdx = idx;
    });

    rows.forEach(row => {
        const wono = row.cells[wonoIdx]?.textContent.trim().toLowerCase() || "";
        const partno = row.cells[partnoIdx]?.textContent.trim().toLowerCase() || "";
        const demandDateStr = row.cells[demandDateIdx]?.textContent.trim() || "";
        let show = true;

        // Parse demand date from the row
        const rowDate = parseDemandDate(demandDateStr);

        // If demandFrom is set, rowDate must be >= demandFrom
        if (demandFrom) {
            const fromDate = new Date(demandFrom); // yyyy-MM-dd input
            fromDate.setHours(0,0,0,0);
            if (!rowDate || rowDate < fromDate) show = false;
        }

        // If demandTo is set, rowDate must be <= demandTo
        if (demandTo) {
            const toDate = new Date(demandTo); // yyyy-MM-dd input
            toDate.setHours(23,59,59,999);
            if (!rowDate || rowDate > toDate) show = false;
        }

        if (searchWONO && !wono.includes(searchWONO)) show = false;
        if (searchPARTNO && !partno.includes(searchPARTNO)) show = false;

        row.style.display = show ? "" : "none";
    });
}

// Helper to parse dd-MMM-yyyy or yyyy-MM-dd to Date
function parseDemandDate(dateStr) {
  if (!dateStr) return null;
  // yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(dateStr);

  // dd-MMM-yyyy (08-Feb-2023)
  const match = dateStr.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/);
  if (match) {
    const [_, dd, mmm, yyyy] = match;
    const monthNum = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].indexOf(mmm);
    if (monthNum >= 0) return new Date(Number(yyyy), monthNum, Number(dd));
  }

  // Fallback: let browser try to parse
  const tryParsed = Date.parse(dateStr);
  if (!isNaN(tryParsed)) return new Date(tryParsed);

  return null;
}


let originalWOData = []; // Backup for canceling
let editingEnabled = false;

function enableWOEditing() {
  const tbody = document.querySelector('#woListTable tbody');
  const rows = tbody.querySelectorAll('tr');
  originalWOData = Array.from(rows).map(row => {
    return Array.from(row.cells).map(cell => cell.textContent);
  });
  rows.forEach(row => {
    Array.from(row.cells).forEach((cell, index) => {
      if (index < 5) { // Make only first 5 columns editable
        cell.contentEditable = true;
      }
    });
  });
  editingEnabled = true;
}

async function saveWODataToServer() {
  if (!woDataStore || woDataStore.length === 0) {
    alert("No WO data to save.");
    return;
  }

  // Send entire array to backend for save/update
  const res = await fetch('/api/woList', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(woDataStore)
  });

  if (res.ok) {
    alert("WO data saved to server successfully!");
  } else {
    alert("Failed to save WO data to server.");
  }
}



function cancelWOEditing() {
  if (!editingEnabled || originalWOData.length === 0) return;
  const rows = document.querySelectorAll('#woListTable tbody tr');
  rows.forEach((row, rowIndex) => {
    originalWOData[rowIndex].forEach((text, colIndex) => {
      row.cells[colIndex].textContent = text;
    });
  });
  disableEditing();
}

function disableEditing() {
  const rows = document.querySelectorAll('#woListTable tbody tr');
  rows.forEach(row => {
    Array.from(row.cells).forEach(cell => cell.contentEditable = false);
  });
  editingEnabled = false;
  originalWOData = [];
}

let woDataStore = [];

async function initializeWOList() {
  await loadWOsFromServer(); // Use your new fetch-from-backend function!
}



function formatDateToDDMMMYYYY(dateStr) {
  if (!dateStr) return '';
  // Accepts "yyyy-mm-dd" or "dd-MMM-yyyy"
  // Parse using your parseDemandDate helper for consistency
  const d = parseDemandDate(dateStr);
  if (!d) return dateStr; // fallback: show as is

  const day = String(d.getDate()).padStart(2, '0');
  const month = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}


async function deleteSelectedWO() {
  const selected = document.querySelectorAll('.wo-checkbox:checked');
  for (const cb of selected) {
    const wono = cb.dataset.wono;
    const row = cb.closest('tr');
    row.remove();
    woDataStore = woDataStore.filter(item => item.WONO !== wono);

    // Call the backend to delete this WO (you must add DELETE endpoint to backend!)
    await fetch(`/api/woList/${encodeURIComponent(wono)}`, {
      method: 'DELETE'
    });
  }
}


async function handleWOImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  const extension = file.name.split('.').pop().toLowerCase();

  if (extension === 'csv') {
    reader.onload = async function (e) {
      const text = e.target.result;
      const rows = text.trim().split('\n').map(row => row.split(','));
      const headers = rows[0].map(h => h.trim());
      const data = rows.slice(1).map(row => {
        let obj = {};
        headers.forEach((h, i) => {
          obj[h] = row[i]?.trim();
        });
        return obj;
      });
      // Save to backend
      await saveWOListToServer(data);
      // Refresh table from backend to ensure all saved
      await loadWOsFromServer();
    };
    reader.readAsText(file);
  } else if (extension === 'xlsx') {
    reader.onload = async function (e) {
      const workbook = XLSX.read(e.target.result, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { raw: false }); // Ensure formatted strings
      // Save to backend
      await saveWOListToServer(json);
      // Refresh table from backend
      await loadWOsFromServer();
    };
    reader.readAsBinaryString(file);
  } else {
    alert('Only CSV and XLSX supported');
  }
}


function toggleSelectAllWO(source) {
  const checkboxes = document.querySelectorAll('.wo-checkbox');
  checkboxes.forEach(cb => cb.checked = source.checked);
}

async function deleteSelectedWO() {
  const selected = document.querySelectorAll('.wo-checkbox:checked');
  let errors = [];

  for (const cb of selected) {
    const wono = cb.dataset.wono;
    const row = cb.closest('tr');

    // Call backend to delete this WO
    try {
      const res = await fetch(`/api/woList/${encodeURIComponent(wono)}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`Server error for WO: ${wono}`);

      // If server deletion succeeded, update UI and local array
      row.remove();
      woDataStore = woDataStore.filter(item => item.WONO !== wono);
    } catch (err) {
      errors.push(wono);
      // Optionally, show a user message for this WO
    }
  }

  if (errors.length > 0) {
    alert(`Failed to delete these WO(s) on the server: ${errors.join(', ')}`);
  }
}


function loadWOsFromLocalStorage() {
  const saved = localStorage.getItem('woDataStore');
  if (!saved) return;

  const data = JSON.parse(saved);
  woDataStore = []; // Reset memory store
  const tbody = document.querySelector('#woListTable tbody');
  tbody.innerHTML = ''; // Clear table

  populateWOTable(data);
}


//Time records section/////////////

function calculateTotals(record) {
  const indirectFields = [
    'INPROG', 'INME', 'INPROGOP', 'ININSP', 'INFAI', 'INGAGE',
    'INWAITCRANE', 'INWAITFORK', 'INMAINT', 'INNOLOAD',
    'ININDIR', 'INSAFETY', 'INMEETING', 'TEABREAK', 'LUNCH'
  ];

  let totalIndirect = indirectFields.reduce((sum, field) => {
    return sum + (parseFloat(record[field]) || 0);
  }, 0) / 60;

  // Universal date parser
  function parseDate(dtStr) {
    if (!dtStr) return null;
    const iso = Date.parse(dtStr);
    if (!isNaN(iso)) return new Date(iso);

    let date = new Date();
    let [time, meridian] = dtStr.split(' ');
    if (!time) return null;
    let [h, m, s] = time.split(':').map(Number);
    if (meridian && meridian.toUpperCase() === 'PM' && h < 12) h += 12;
    if (meridian && meridian.toUpperCase() === 'AM' && h === 12) h = 0;
    date.setHours(h || 0, m || 0, s || 0, 0);
    return date;
  }

  const start = record['OPNSTART'] ? parseDate(record['OPNSTART']) : null;
  const stop = record['OPNSTOP'] ? parseDate(record['OPNSTOP']) : null;
  const totalOPN = (start && stop) ? Math.abs(stop - start) / (1000 * 60 * 60) : 0; // in hours

  // The correct "Actual Absorption" is opn time MINUS total indirect time:
  const actualAbsorption = totalOPN - totalIndirect;

  return {
    'Total Indirect Time': totalIndirect.toFixed(2),
    'Total OPN Time': totalOPN.toFixed(2),
    'Actual Absorption': actualAbsorption > 0 ? actualAbsorption.toFixed(2) : "0.00"
  };
}



async function addTimeRecordFromForm(formData) {
  // You may not know the ID, so let the server assign it (if needed)
  const totals = calculateTotals(formData);
  const fullRecord = {
    ...formData,
    ...totals,
    'Mon-Year': getMonthYear(formData['DEMANDDATE'])
  };

  // Send to server
  await fetch('/api/timeRecords', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fullRecord)
  });

  // Optionally re-load time records after saving
  await loadTimeRecordsFromServer();
  populateTimeRecordsTable();
}

async function loadTimeRecordsFromServer() {
  const res = await fetch('/api/timeRecords');
  if (!res.ok) {
    alert("Failed to load time records!");
    return;
  }
  timeRecords = await res.json();
}

async function deleteSelectedTimeRecords() {
  const selected = document.querySelectorAll('.record-checkbox:checked');
  const idsToDelete = Array.from(selected).map(cb => parseInt(cb.dataset.id));

  for (const id of idsToDelete) {
    await fetch(`/api/timeRecords/${id}`, { method: 'DELETE' });
  }
  await loadTimeRecordsFromServer();
  populateTimeRecordsTable();
}

async function addOrUpdateTimeRecord(formData, recordID = null) {
  const totals = calculateTotals(formData);
  const fullRecord = {
    ...formData,
    ...totals,
    'Mon-Year': getMonthYear(formData['DEMANDDATE'])
  };
  let url = '/api/timeRecords';
  let method = 'POST';

  if (recordID) {
    url = `/api/timeRecords/${recordID}`;
    method = 'PUT';
  }

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fullRecord)
  });

  if (res.ok) {
    await loadTimeRecordsFromServer();
    populateTimeRecordsTable();
    alert("✅ Record saved.");
  } else {
    alert("❌ Failed to save record!");
  }
}

function populateTimeRecordsTable() {
  const tbody = document.querySelector('#timeRecordsTable tbody');
  tbody.innerHTML = '';
  timeRecords.forEach(record => {
    const opnStartDate = record['OPNSTART'] ? parseDate(record['OPNSTART']) : null;
    const opnStopDate = record['OPNSTOP'] ? parseDate(record['OPNSTOP']) : null;
    // Calculate Total OPN Time
    let totalOPN = (opnStartDate && opnStopDate)
      ? (opnStopDate - opnStartDate) / (1000 * 60 * 60)
      : 0;
    if (totalOPN < 0 || isNaN(totalOPN)) totalOPN = 0;
    // Calculate Indirect
    const indirectFields = [
      'INPROG', 'INME', 'INPROGOP', 'ININSP', 'INFAI', 'INGAGE',
      'INWAITCRANE', 'INWAITFORK', 'INMAINT', 'INNOLOAD',
      'ININDIR', 'INSAFETY', 'INMEETING', 'TEABREAK', 'LUNCH'
    ];
    let totalIndirect = indirectFields.reduce((sum, key) => sum + (parseFloat(record[key]) || 0), 0) / 60;
    // Calculate Absorption
    let actualAbsorption = totalOPN - totalIndirect;
    if (actualAbsorption < 0 || isNaN(actualAbsorption)) actualAbsorption = 0;

    // MonYY as dd-MMM-yyyy from OPNSTOP
    let monYY = record['MonYY'];
    if (!monYY && opnStopDate) {
      const day = String(opnStopDate.getDate()).padStart(2, '0');
      const month = opnStopDate.toLocaleString('en-US', { month: 'short' });
      const year = opnStopDate.getFullYear();
      monYY = `${day}-${month}-${year}`;
    }

    row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="checkbox" class="record-checkbox" data-id="${record.ID}"></td>
      <td>${record.ID}</td>
      <td>${record['WONO']}</td>
      <td>${record['PARTNO']}</td>
      <td>${record['DESCRIPTION']}</td>
      <td>${record['DEMANDDATE']}</td>
      <td>${record['OPNNO']}</td>
      <td>${record['SETUPRUN']}</td>
      <td>${record['MCCODE']}</td>
      <td>${record['EMPCODE']}</td>
      <td>${record['SHIFT']}</td>
      <td>${opnStartDate ? opnStartDate.toLocaleTimeString() : ''}</td>
      <td>${monYY || ''}</td>
      <td>${record['QTYCOMPLETED']}</td>
      <td>${opnStopDate ? opnStopDate.toLocaleTimeString() : ''}</td>
      <td>${record['INPROG'] || ''}</td>
      <td>${record['INME'] || ''}</td>
      <td>${record['INPROGOP'] || ''}</td>
      <td>${record['ININSP'] || ''}</td>
      <td>${record['INFAI'] || ''}</td>
      <td>${record['INGAGE'] || ''}</td>
      <td>${record['INWAITCRANE'] || ''}</td>
      <td>${record['INWAITFORK'] || ''}</td>
      <td>${record['INMAINT'] || ''}</td>
      <td>${record['INNOLOAD'] || ''}</td>
      <td>${record['ININDIR'] || ''}</td>
      <td>${record['INSAFETY'] || ''}</td>
      <td>${record['INMEETING'] || ''}</td>
      <td>${record['TEABREAK'] || ''}</td>
      <td>${record['LUNCH'] || ''}</td>
      <td>${totalIndirect.toFixed(2)}</td>
      <td>${totalOPN.toFixed(2)}</td>
      <td>${actualAbsorption.toFixed(2)}</td>
      <td>${record['Mon-Year'] || ''}</td>
    `;
    tbody.appendChild(row);
  });
}


// Helper: parses time in "hh:mm:ss AM/PM" format and returns a Date object set to baseDate
function convertTo24HourDate(timeStr, baseDate) {
  if (!timeStr) return null;
  const date = baseDate ? new Date(baseDate) : new Date();
  const [time, modifier] = timeStr.split(' ');
  if (!time || !modifier) return null;
  let [hours, minutes, seconds] = time.split(':').map(Number);
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  date.setHours(hours, minutes, seconds, 0);
  return date;
}





function toggleSelectAllTimeRecords(source) {
  const checkboxes = document.querySelectorAll('.record-checkbox');
  checkboxes.forEach(cb => cb.checked = source.checked);
}

function loadTimeRecords() {
  const saved = localStorage.getItem('timeRecords');
  timeRecords = saved ? JSON.parse(saved) : [];
  populateTimeRecordsTable();
}

function getMonthYear(dateStr) {
  const d = new Date(dateStr);
  return `${d.toLocaleString('default', { month: 'short' })}-${d.getFullYear()}`;
}

// Time entry activity///

// Auto-fill form when WONO is entered
document.getElementById("wono").addEventListener("change", function () {
  const wonoInput = this.value.trim();
  const match = woDataStore.find(row => String(row['WONO']).trim() === wonoInput);

  if (match) {
    document.getElementById("partno").value = match['PARTNO'] || '';
    document.getElementById("desc").value = match['Description'] || '';
    document.getElementById("woqty").value = match['WOQTY'] || '';
    
    // Convert date if needed
    const rawDate = match['DEMANDDATE'];
    const parsedDate = new Date(rawDate);
    if (!isNaN(parsedDate)) {
      document.getElementById("demandDate").value = parsedDate.toISOString().split("T")[0];
    } else {
      document.getElementById("demandDate").value = '';
    }
  } else {
    alert("⚠️ WO not found in the WO List.");
    document.getElementById("partno").value = '';
    document.getElementById("desc").value = '';
    document.getElementById("woqty").value = '';
    document.getElementById("demandDate").value = '';
  }
});


let opnStartTime = null; // stores timestamp
let opnTimerInterval = null;

document.getElementById("opnStartBtn").addEventListener("click", () => {
  const now = new Date();
  opnStartTime = now;
  document.getElementById("opnStart").value = now.toISOString(); // Save ISO string
  console.log("OPN Start Time Recorded:", now.toISOString());

  // Optional: Simulate backend clock
  if (opnTimerInterval) clearInterval(opnTimerInterval);
  opnTimerInterval = setInterval(() => {
    const duration = ((new Date() - opnStartTime) / 1000).toFixed(0);
    console.log("⏱ OPN Running: ", duration + "s");
  }, 1000);
});

function formatTime(dtStr) {
    if (!dtStr) return '';
    const d = new Date(dtStr);
    return d.toLocaleTimeString(); // or your preferred display
}

function formatTimeOnly(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  // Use local time format
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}


document.getElementById("opnStopBtn").addEventListener("click", () => {
  const now = new Date();
  document.getElementById("opnStop").value = now.toISOString();
  console.log("OPN Stop Time Recorded:", now.toISOString());

  if (opnTimerInterval) {
    clearInterval(opnTimerInterval);
    opnTimerInterval = null;
  }

  if (opnStartTime) {
    const duration = ((now - opnStartTime) / 1000 / 60).toFixed(2);
    console.log("✅ Total Operation Duration: " + duration + " minutes");
  } else {
    console.warn("⚠️ Start time not set.");
  }
});


// Load part details from WO List based on WONO
document.getElementById("wono").addEventListener("change", function () {
  const wono = this.value.trim();
  const woMatch = woDataStore.find(row => String(row['WONO']).trim() === wono);

  if (woMatch) {
    document.getElementById("partno").value = woMatch['PARTNO'] || '';
    document.getElementById("desc").value = woMatch['Description'] || '';
    document.getElementById("woqty").value = woMatch['WOQTY'] || '';
    const rawDate = woMatch['DEMANDDATE'];
    const parsed = new Date(rawDate);
    if (!isNaN(parsed)) {
      document.getElementById("demandDate").value = parsed.toISOString().split("T")[0];
    } else {
      document.getElementById("demandDate").value = '';
    }
  } else {
    alert("⚠️ WO not found in the WO List.");
    document.getElementById("partno").value = '';
    document.getElementById("desc").value = '';
    document.getElementById("woqty").value = '';
    document.getElementById("demandDate").value = '';
  }
});

async function loadTimeRecordByKey() {
  const wono = document.getElementById("wono").value.trim();
  const opnno = document.getElementById("opnno").value.trim();
  const setupRun = document.getElementById("setupRun").value;

  // Fetch all records from server
  const res = await fetch('/api/timeRecords');
  const records = res.ok ? await res.json() : [];

  // Find match (unchanged)
  const match = records.find(r => r.WONO === wono && r.OPNNO === opnno && r.SETUPRUN === setupRun);

  if (match) {
    document.getElementById("mcCode").value = match.MCCODE || '';
    document.getElementById("empCode").value = match.EMPCODE || '';
    // Do NOT set setupRun here!
    document.getElementById("shift").value = match.SHIFT || '';
    document.getElementById("qtyCompleted").value = match.QTYCOMPLETED || '';
    document.getElementById("opnStart").value = match.OPNSTART || '';
    document.getElementById("opnStop").value = match.OPNSTOP || '';

    document.getElementById("inprog").value = match.INPROG || '';
    document.getElementById("inme").value = match.INME || '';
    document.getElementById("inprogop").value = match.INPROGOP || '';
    document.getElementById("ininsp").value = match.ININSP || '';
    document.getElementById("infai").value = match.INFAI || '';
    document.getElementById("ingage").value = match.INGAGE || '';
    document.getElementById("inwaitcrane").value = match.INWAITCRANE || '';
    document.getElementById("inwaitfork").value = match.INWAITFORK || '';
    document.getElementById("inmaint").value = match.INMAINT || '';
    document.getElementById("innoload").value = match.INNOLOAD || '';
    document.getElementById("inindir").value = match.ININDIR || '';
    document.getElementById("insafety").value = match.INSAFETY || '';
    document.getElementById("inmeeting").value = match.INMEETING || '';
    document.getElementById("teaBreak").value = match.TEABREAK || '';
    document.getElementById("lunch").value = match.LUNCH || '';
  } else {
    resetOperationAndIndirectFields();
  }
}


document.getElementById("opnno").addEventListener("change", loadTimeRecordByKey);
document.getElementById("setupRun").addEventListener("change", loadTimeRecordByKey);

function resetOperationAndIndirectFields() {
  const ids = [
    'mcCode', 'empCode', /*'setupRun',*/ 'shift', 'qtyCompleted', 'opnStart', 'opnStop',
    'inprog', 'inme', 'inprogop', 'ininsp', 'infai', 'ingage',
    'inwaitcrane', 'inwaitfork', 'inmaint', 'innoload',
    'inindir', 'insafety', 'inmeeting', 'teaBreak', 'lunch'
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === 'SELECT') el.selectedIndex = 0;
    else el.value = '';
  });
}


// Save button - Save or update based on WONO + OPNNO key
document.getElementById("saveBtn").addEventListener("click", function (e) {
  e.preventDefault();

  const wono = document.getElementById("wono").value.trim();
  const opnno = document.getElementById("opnno").value.trim();
  const setupRun = document.getElementById("setupRun").value;
  if (!wono || !opnno || !setupRun) return alert("Please enter WONO, OPN NO and Setup/Run");

  const records = JSON.parse(localStorage.getItem("timeRecords") || "[]");
  let record = records.find(r => r.WONO === wono && r.OPNNO === opnno && r.SETUPRUN === setupRun);
  const index = records.findIndex(r => r.WONO === wono && r.OPNNO === opnno && r.SETUPRUN === setupRun);

  // --- Set MonYY based on actual OPNSTOP datetime ---
  let monYY = record && record.MonYY ? record.MonYY : '';
  const opnStopVal = document.getElementById("opnStop").value;

  if (!monYY && opnStopVal) {
      const stopDate = new Date(opnStopVal);
      if (!isNaN(stopDate.getTime())) {
          const day = String(stopDate.getDate()).padStart(2, '0');
          const month = stopDate.toLocaleString('en-US', { month: 'short' });
          const year = stopDate.getFullYear();
          monYY = `${day}-${month}-${year}`;
      }
  }

  const newData = {
    ID: record?.ID || (records.length ? Math.max(...records.map(r => r.ID || 0)) + 1 : 1),
    WONO: wono,
    PARTNO: document.getElementById("partno").value.trim(),
    DESCRIPTION: document.getElementById("desc").value.trim(),
    WOQTY: document.getElementById("woqty").value.trim(),
    DEMANDDATE: document.getElementById("demandDate").value,
    OPNNO: opnno,
    SETUPRUN: setupRun,
    MCCODE: document.getElementById("mcCode").value.trim(),
    EMPCODE: document.getElementById("empCode").value.trim(),
    SHIFT: document.getElementById("shift").value,
    QTYCOMPLETED: document.getElementById("qtyCompleted").value,
    OPNSTART: document.getElementById("opnStart").value,
    OPNSTOP: document.getElementById("opnStop").value,

    INPROG: document.getElementById("inprog").value,
    INME: document.getElementById("inme").value,
    INPROGOP: document.getElementById("inprogop").value,
    ININSP: document.getElementById("ininsp").value,
    INFAI: document.getElementById("infai").value,
    INGAGE: document.getElementById("ingage").value,
    INWAITCRANE: document.getElementById("inwaitcrane").value,
    INWAITFORK: document.getElementById("inwaitfork").value,
    INMAINT: document.getElementById("inmaint").value,
    INNOLOAD: document.getElementById("innoload").value,
    ININDIR: document.getElementById("inindir").value,
    INSAFETY: document.getElementById("insafety").value,
    INMEETING: document.getElementById("inmeeting").value,
    TEABREAK: document.getElementById("teaBreak").value,
    LUNCH: document.getElementById("lunch").value,
    MonYY: monYY // Save only once, do not update after initial posting
  };

  if (index >= 0) {
    records[index] = newData;
  } else {
    records.push(newData);
  }

  localStorage.setItem("timeRecords", JSON.stringify(records));
  alert("✅ Record saved.");

  populateTimeEntrySummaryTable();
  resetTimeEntryForm();
});


document.getElementById("resetBtn").addEventListener("click", resetTimeEntryForm);

function resetTimeEntryForm(exceptField) {
  const fieldsToClear = [
    'wono', 'partno', 'desc', 'woqty', 'demandDate', 'opnno', 'mcCode', 'empCode',
    'setupRun', 'shift', 'qtyCompleted', 'opnStart', 'opnStop',
    'inprog', 'inme', 'inprogop', 'ininsp', 'infai', 'ingage',
    'inwaitcrane', 'inwaitfork', 'inmaint', 'innoload',
    'inindir', 'insafety', 'inmeeting', 'teaBreak', 'lunch'
  ];

  fieldsToClear.forEach(id => {
    // Skip the field that triggered the reset
    if (id === exceptField) return;

    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === 'SELECT') {
      el.selectedIndex = 0;
    } else if (el.type === 'date') {
      el.value = '';
    } else {
      el.value = '';
    }
  });
}



async function populateTimeEntrySummaryTable() {
  const tbody = document.querySelector('#entrySummary tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  const res = await fetch('/api/timeRecords');
  let records = res.ok ? await res.json() : [];
  records.sort((a, b) => b.ID - a.ID);
  records = records.slice(0, 20);

  records.forEach(record => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${record.ID}</td>
      <td>${record.WONO || ''}</td>
      <td>${record.PARTNO || ''}</td>
      <td>${record.DESCRIPTION || ''}</td>
      <td>${record.DEMANDDATE || ''}</td>
      <td>${record.OPNNO || ''}</td>
      <td>${record.SETUPRUN || ''}</td>
      <td>${record.MCCODE || ''}</td>
      <td>${record.EMPCODE || ''}</td>
      <td>${record.SHIFT || ''}</td>
      <td>${record.OPNSTART || ''}</td>
      <td>${record.QTYCOMPLETED || ''}</td>
      <td>${record.OPNSTOP || ''}</td>
      <td>
        ${record.INPROG || 0}, ${record.INME || 0}, ${record.INPROGOP || 0}, 
        ${record.ININSP || 0}, ${record.INFAI || 0}, ${record.INGAGE || 0}, 
        ${record.INWAITCRANE || 0}, ${record.INWAITFORK || 0}, ${record.INMAINT || 0}, 
        ${record.INNOLOAD || 0}, ${record.ININDIR || 0}, ${record.INSAFETY || 0}, 
        ${record.INMEETING || 0}, ${record.TEABREAK || 0}, ${record.LUNCH || 0}
      </td>
      <td>
        <button type="button" onclick="loadSummaryEntryToForm(${record.ID})">Select</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}



async function loadSummaryEntryToForm(recordID) {
  await loadTimeRecordsFromServer();
  const match = timeRecords.find(r => r.ID === recordID);
  if (!match) return alert("Record not found!");

  document.getElementById("wono").value = match.WONO || '';
  document.getElementById("partno").value = match.PARTNO || '';
  document.getElementById("desc").value = match.DESCRIPTION || '';
  document.getElementById("woqty").value = match.WOQTY || '';
  document.getElementById("demandDate").value = match.DEMANDDATE || '';
  document.getElementById("opnno").value = match.OPNNO || '';
  document.getElementById("setupRun").value = match.SETUPRUN || '';
  document.getElementById("mcCode").value = match.MCCODE || '';
  document.getElementById("empCode").value = match.EMPCODE || '';
  document.getElementById("shift").value = match.SHIFT || '';
  document.getElementById("qtyCompleted").value = match.QTYCOMPLETED || '';
  document.getElementById("opnStart").value = match.OPNSTART || '';
  document.getElementById("opnStop").value = match.OPNSTOP || '';

  document.getElementById("inprog").value = match.INPROG || '';
  document.getElementById("inme").value = match.INME || '';
  document.getElementById("inprogop").value = match.INPROGOP || '';
  document.getElementById("ininsp").value = match.ININSP || '';
  document.getElementById("infai").value = match.INFAI || '';
  document.getElementById("ingage").value = match.INGAGE || '';
  document.getElementById("inwaitcrane").value = match.INWAITCRANE || '';
  document.getElementById("inwaitfork").value = match.INWAITFORK || '';
  document.getElementById("inmaint").value = match.INMAINT || '';
  document.getElementById("innoload").value = match.INNOLOAD || '';
  document.getElementById("inindir").value = match.ININDIR || '';
  document.getElementById("insafety").value = match.INSAFETY || '';
  document.getElementById("inmeeting").value = match.INMEETING || '';
  document.getElementById("teaBreak").value = match.TEABREAK || '';
  document.getElementById("lunch").value = match.LUNCH || '';

  document.getElementById("wono").focus();
}


// ========== Bind events ==========
document.addEventListener('DOMContentLoaded', () => {
  autoCloseActiveShifts();
  // Only if on homeView
  if (!document.getElementById('homeView')) return;

  // Initial dashboard load
  refreshDashboard();

  // Refresh on dropdown change
  document.getElementById('yearDropdown').addEventListener('change', drawDashboardCharts);
  document.getElementById('monthDropdown').addEventListener('change', drawDashboardCharts);
});


const SHIFT_END_TIMES = {
  "Morn(7a-3p)": { hour: 15, minute: 0 },    // 3:00 PM
  "Day(7a-7p)": { hour: 19, minute: 0 },     // 7:00 PM
  "Even(3p-11p)": { hour: 23, minute: 0 },   // 11:00 PM
  "Night(7p-7a)": { hour: 7, minute: 0 }     // 7:00 AM (next day)
};


// Updated autoCloseActiveShifts() function
async function autoCloseActiveShifts() {
    await loadTimeRecordsFromServer();
    let updated = false;
    const now = new Date();
    for (let record of timeRecords) {
     if (!record.OPNSTOP && record.OPNSTART && record.SHIFT) {
      const startDate = new Date(record.OPNSTART);
      if (isNaN(startDate.getTime())) continue;
      const shiftType = record.SHIFT.trim();
      let shiftEndDate = new Date(startDate);
            if (shiftType === "Night(7p-7a)") {
                // Night shift spans 7 PM to 7 AM next day
                const startHour = startDate.getHours();
                if (startHour < 7) {
                    // If started after midnight (before 7 AM), ends at 7 AM same day
                    shiftEndDate.setHours(7, 0, 0, 0);
                } else {
                    // If started on or after 7 AM (likely after 7 PM of that day), ends at 7 AM next day
                    shiftEndDate.setDate(shiftEndDate.getDate() + 1);
                    shiftEndDate.setHours(7, 0, 0, 0);
                }
            } else {
                // Other shifts have fixed end time on the same day
                const shiftEnd = SHIFT_END_TIMES[shiftType];
                if (!shiftEnd) return; // skip if shift type not recognized
                shiftEndDate.setHours(shiftEnd.hour, shiftEnd.minute, 0, 0);
            }
            // If current time is past the calculated shift end, auto-close the shift
            if (now > shiftEndDate) {
                record.OPNSTOP = shiftEndDate.toISOString();
                updated = true;
            }
        }
    });
    if (updated) {
         await loadTimeRecordsFromServer();
    }
}

document.getElementById("exportExcelBtn").addEventListener("click", async function() {
    let records = JSON.parse(localStorage.getItem("timeRecords") || "[]");
    await loadTimeRecordsFromServer();
    let records = [...timeRecords];
    if (!records.length) {
      alert("No data to export!");
      return;
    }

    // Helper for indirect sum
    const indirectFields = [
        'INPROG', 'INME', 'INPROGOP', 'ININSP', 'INFAI', 'INGAGE',
        'INWAITCRANE', 'INWAITFORK', 'INMAINT', 'INNOLOAD',
        'ININDIR', 'INSAFETY', 'INMEETING', 'TEABREAK', 'LUNCH'
    ];

    // MonYY date logic as in your table
    function getMonYY(record) {
        if (record['MonYY']) return record['MonYY'];
        if (record['OPNSTART'] && record['OPNSTOP']) {
            const d = new Date();
            const day = String(d.getDate()).padStart(2, '0');
            const month = d.toLocaleString('en-US', { month: 'short' });
            const year = d.getFullYear();
            return `${day}-${month}-${year}`;
        }
        return '';
    }

    // Build array of rows in correct order/format
    const exportData = records.map(record => {
        // Indirect time total (in hours)
        const totalIndirect = indirectFields.reduce((sum, key) => sum + (parseFloat(record[key]) || 0), 0) / 60;
        // Total operation time
        const opnStart = convertTo24HourDate(record['OPNSTART']);
        const opnStop = convertTo24HourDate(record['OPNSTOP']);
        const totalOpnTime = (opnStart && opnStop) ? ((opnStop - opnStart) / 1000 / 60 / 60) : '';
        // Actual absorption
        const actualAbsorption = (typeof totalOpnTime === 'number' && totalOpnTime !== '' && !isNaN(totalOpnTime))
            ? (totalOpnTime - totalIndirect).toFixed(2)
            : '';

        return {
            // Columns in order:
            "ID": record.ID,
            "WONO": record['WONO'],
            "PARTNO": record['PARTNO'],
            "DESCRIPTION": record['DESCRIPTION'],
            "DEMANDDATE": record['DEMANDDATE'],
            "OPNNO": record['OPNNO'],
            "SETUPRUN": record['SETUPRUN'],
            "MCCODE": record['MCCODE'],
            "EMPCODE": record['EMPCODE'],
            "SHIFT": record['SHIFT'],
            "OPNSTART": record['OPNSTART'],
            "MonYY": getMonYY(record),
            "QTYCOMPLETED": record['QTYCOMPLETED'],
            "OPNSTOP": record['OPNSTOP'],
            "INPROG": record['INPROG'],
            "INME": record['INME'],
            "INPROGOP": record['INPROGOP'],
            "ININSP": record['ININSP'],
            "INFAI": record['INFAI'],
            "INGAGE": record['INGAGE'],
            "INWAITCRANE": record['INWAITCRANE'],
            "INWAITFORK": record['INWAITFORK'],
            "INMAINT": record['INMAINT'],
            "INNOLOAD": record['INNOLOAD'],
            "ININDIR": record['ININDIR'],
            "INSAFETY": record['INSAFETY'],
            "INMEETING": record['INMEETING'],
            "TEABREAK": record['TEABREAK'],
            "LUNCH": record['LUNCH'],
            "Total Indirect Time": totalIndirect.toFixed(2),
            "Total OPN Time": (typeof totalOpnTime === 'number' && !isNaN(totalOpnTime)) ? totalOpnTime.toFixed(2) : '',
            "Actual Absorption": actualAbsorption,
            "Mon-Year": record['Mon-Year'] || ''
        };
    });

    // SheetJS export in column order
    const ws = XLSX.utils.json_to_sheet(exportData, { header: [
        "ID","WONO","PARTNO","DESCRIPTION","DEMANDDATE","OPNNO","SETUPRUN","MCCODE","EMPCODE","SHIFT","OPNSTART",
        "MonYY","QTYCOMPLETED","OPNSTOP","INPROG","INME","INPROGOP","ININSP","INFAI","INGAGE","INWAITCRANE",
        "INWAITFORK","INMAINT","INNOLOAD","ININDIR","INSAFETY","INMEETING","TEABREAK","LUNCH",
        "Total Indirect Time","Total OPN Time","Actual Absorption","Mon-Year"
    ] });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Time Records");
    XLSX.writeFile(wb, "time_records.xlsx");
});





// ========== Dashboard/Dynamic Graph Logic ==========

function isHomeViewActive() {
  const homeView = document.getElementById('homeView');
  return homeView && !homeView.classList.contains('hidden');
}

// ========= Chart.js Dashboard Code (All 5 charts + table) ==========

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

let chart1, chart2, chart3, chart4, chart5;

// --- Helper: get actual absorption ---
function getActualAbsorption(r) {
  if (!(r.OPNSTART && r.OPNSTOP)) return 0;
  const start = new Date(r.OPNSTART), stop = new Date(r.OPNSTOP);
  if (isNaN(start) || isNaN(stop)) return 0;
  const totalHours = (stop - start) / (1000 * 60 * 60);
  const indirectFields = [
    'INPROG', 'INME', 'INPROGOP', 'ININSP', 'INFAI', 'INGAGE',
    'INWAITCRANE', 'INWAITFORK', 'INMAINT', 'INNOLOAD',
    'ININDIR', 'INSAFETY', 'INMEETING', 'TEABREAK', 'LUNCH'
  ];
  const indirectHours = indirectFields.reduce((sum, k) => sum + (parseFloat(r[k]) || 0), 0) / 60;
  return Math.max(totalHours - indirectHours, 0);
}

// --- Populate Year/Month Dropdowns based on data ---
async function populateDashboardDropdowns() {
  const records = JSON.parse(localStorage.getItem("timeRecords") || "[]");
  let yearSet = new Set();
  let monthsByYear = {};
  records.forEach(r => {
    let stopStr = r.OPNSTOP || r.OPNSTOPTIME;
    if (!stopStr) return;
    let d = new Date(stopStr);
    if (isNaN(d)) return;
    let y = d.getFullYear(), m = d.getMonth() + 1;
    yearSet.add(y);
    if (!monthsByYear[y]) monthsByYear[y] = new Set();
    monthsByYear[y].add(m);
  });
  let years = Array.from(yearSet).sort((a, b) => b - a);
  // Year dropdown
  const yearDropdown = document.getElementById('yearDropdown');
  yearDropdown.innerHTML = '';
  years.forEach(y => {
    let option = document.createElement('option');
    option.value = y;
    option.textContent = y;
    yearDropdown.appendChild(option);
  });
  function updateMonthDropdown(selectedYear) {
    const monthDropdown = document.getElementById('monthDropdown');
    monthDropdown.innerHTML = '';
    let months = monthsByYear[selectedYear] ? Array.from(monthsByYear[selectedYear]) : [];
    months.sort((a, b) => a - b);
    months.forEach(m => {
      let option = document.createElement('option');
      option.value = m;
      option.textContent = monthNames[m - 1];
      monthDropdown.appendChild(option);
    });
    if (months.length) monthDropdown.value = months[months.length - 1];
  }
  yearDropdown.onchange = function () {
    updateMonthDropdown(parseInt(this.value, 10));
    drawDashboardCharts();
  };
  if (years.length) {
    yearDropdown.value = years[0];
    updateMonthDropdown(years[0]);
  }
}

// --- Prepare All Chart Data ---
async function prepareChartData() {
  const records = JSON.parse(localStorage.getItem("timeRecords") || "[]");
  const yearDropdown = document.getElementById('yearDropdown');
  const monthDropdown = document.getElementById('monthDropdown');
  const y = parseInt(yearDropdown.value, 10);
  const m = parseInt(monthDropdown.value, 10);

  // 1. Daily Absorption (Setup/Run stacked by day)
  let daysInMonth = new Date(y, m, 0).getDate();
  let dailySetup = Array(daysInMonth).fill(0);
  let dailyRun = Array(daysInMonth).fill(0);
  records.forEach(r => {
    let stopStr = r.OPNSTOP || r.OPNSTOPTIME;
    if (!stopStr) return;
    let stopDate = new Date(stopStr);
    if (stopDate.getFullYear() !== y || (stopDate.getMonth() + 1) !== m) return;
    let day = stopDate.getDate();
    let hours = getActualAbsorption(r);
    let opnType = (r.SETUPRUN || r['OPN TYPE'] || '').toLowerCase();
    if (opnType.includes('setup')) dailySetup[day - 1] += hours;
    else if (opnType.includes('run')) dailyRun[day - 1] += hours;
  });

  // 2. Daily Indirect
  let indirectFields = [
    'INPROG', 'INME', 'INPROGOP', 'ININSP', 'INFAI', 'INGAGE',
    'INWAITCRANE', 'INWAITFORK', 'INMAINT', 'INNOLOAD',
    'ININDIR', 'INSAFETY', 'INMEETING', 'TEABREAK', 'LUNCH'
  ];
  let dailyIndirect = Array(daysInMonth).fill(0);
  records.forEach(r => {
    let stopStr = r.OPNSTOP || r.OPNSTOPTIME;
    if (!stopStr) return;
    let stopDate = new Date(stopStr);
    if (stopDate.getFullYear() !== y || (stopDate.getMonth() + 1) !== m) return;
    let day = stopDate.getDate();
    let totalInd = indirectFields.reduce((sum, k) => sum + (parseFloat(r[k]) || 0), 0) / 60;
    dailyIndirect[day - 1] += totalInd;
  });

  // 3. Monthly Absorption (Setup/Run by month)
  let monthlySetup = Array(12).fill(0);
  let monthlyRun = Array(12).fill(0);
  records.forEach(r => {
    let stopStr = r.OPNSTOP || r.OPNSTOPTIME;
    if (!stopStr) return;
    let stopDate = new Date(stopStr);
    if (stopDate.getFullYear() !== y) return;
    let monIdx = stopDate.getMonth();
    let hours = getActualAbsorption(r);
    let opnType = (r.SETUPRUN || r['OPN TYPE'] || '').toLowerCase();
    if (opnType.includes('setup')) monthlySetup[monIdx] += hours;
    else if (opnType.includes('run')) monthlyRun[monIdx] += hours;
  });

  // 4. Monthly Indirect (by month)
  let monthlyIndirect = Array(12).fill(0);
  records.forEach(r => {
    let stopStr = r.OPNSTOP || r.OPNSTOPTIME;
    if (!stopStr) return;
    let stopDate = new Date(stopStr);
    if (stopDate.getFullYear() !== y) return;
    let monIdx = stopDate.getMonth();
    let totalInd = indirectFields.reduce((sum, k) => sum + (parseFloat(r[k]) || 0), 0) / 60;
    monthlyIndirect[monIdx] += totalInd;
  });

  // 5. Employee x Month matrix
  let opnTimeMatrix = {};
  records.forEach(r => {
    let emp = r.EMPCODE || r.EMPCode || 'NA';
    let stopStr = r.OPNSTOP || r.OPNSTOPTIME;
    if (!stopStr) return;
    let stopDate = new Date(stopStr);
    if (stopDate.getFullYear() !== y) return;
    let monIdx = stopDate.getMonth();
    let hours = getActualAbsorption(r);
    if (!opnTimeMatrix[emp]) opnTimeMatrix[emp] = Array(12).fill(0);
    opnTimeMatrix[emp][monIdx] += hours;
  });

  return {
    dailySetup,
    dailyRun,
    dailyIndirect,
    monthlySetup,
    monthlyRun,
    monthlyIndirect,
    opnTimeMatrix,
    y, m
  };
}

// --- Draw all charts ---
async function drawDashboardCharts() {
  const {
    dailySetup,
    dailyRun,
    dailyIndirect,
    monthlySetup,
    monthlyRun,
    monthlyIndirect,
    opnTimeMatrix,
    y, m
  } = prepareChartData();

  // Destroy previous charts
  [chart1, chart2, chart3, chart4, chart5].forEach(c => c && c.destroy());

  // Labels
  const daysInMonth = dailySetup.length;
  let dayLabels = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString().padStart(2, '0') + '-' + monthNames[m - 1]);

  // 1. Daily Absorption (Setup + Run stacked)
  chart1 = new Chart(document.getElementById('chart1').getContext('2d'), {
    type: 'bar',
    data: {
      labels: dayLabels,
      datasets: [
        {
          label: 'Setup',
          data: dailySetup,
          backgroundColor: '#1976d2',
        },
        {
          label: 'Run',
          data: dailyRun,
          backgroundColor: '#ff9800',
        }
      ]
    },
    options: {
      plugins: { legend: { position: 'top' } },
      responsive: true,
      scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Hours' } }
      }
    }
  });

  // 2. Daily Indirect
  chart2 = new Chart(document.getElementById('chart2').getContext('2d'), {
    type: 'bar',
    data: {
      labels: dayLabels,
      datasets: [
        {
          label: 'Indirect Hours',
          data: dailyIndirect,
          backgroundColor: '#009688'
        }
      ]
    },
    options: {
      plugins: { legend: { display: false } },
      responsive: true,
      scales: { y: { beginAtZero: true, title: { display: true, text: 'Hours' } } }
    }
  });

  // 3. Monthly Absorption
  chart3 = new Chart(document.getElementById('chart3').getContext('2d'), {
    type: 'bar',
    data: {
      labels: monthNames,
      datasets: [
        {
          label: 'Setup',
          data: monthlySetup,
          backgroundColor: '#1976d2',
        },
        {
          label: 'Run',
          data: monthlyRun,
          backgroundColor: '#ff9800',
        }
      ]
    },
    options: {
      plugins: { legend: { position: 'top' } },
      responsive: true,
      scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Hours' } } }
    }
  });

  // 4. Monthly Indirect
  chart4 = new Chart(document.getElementById('chart4').getContext('2d'), {
    type: 'bar',
    data: {
      labels: monthNames,
      datasets: [
        {
          label: 'Indirect Hours',
          data: monthlyIndirect,
          backgroundColor: '#009688'
        }
      ]
    },
    options: {
      plugins: { legend: { display: false } },
      responsive: true,
      scales: { y: { beginAtZero: true, title: { display: true, text: 'Hours' } } }
    }
  });

  // 5. Employee x Month (stacked)
  const employees = Object.keys(opnTimeMatrix).sort();
  chart5 = new Chart(document.getElementById('chart5').getContext('2d'), {
    type: 'bar',
    data: {
      labels: employees,
      datasets: monthNames.map((mon, i) => ({
        label: mon,
        data: employees.map(e => opnTimeMatrix[e][i] || 0),
        backgroundColor: `hsl(${i * 30},70%,60%)`
      }))
    },
    options: {
      plugins: { legend: { position: 'top' } },
      responsive: true,
      scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Hours' } } }
    }
  });

  // --- Table for Employee x Month ---
  const tableDiv = document.getElementById('chart5-table');
  let html = '<table border="1" style="width:100%; border-collapse:collapse;"><thead><tr><th>Employee</th>';
  for (let mi = 0; mi < 12; ++mi) html += `<th>${monthNames[mi]}</th>`;
  html += '</tr></thead><tbody>';
  employees.forEach(e => {
    html += `<tr><td>${e}</td>`;
    for (let mi = 0; mi < 12; ++mi)
      html += `<td>${(opnTimeMatrix[e][mi] || 0).toFixed(2)}</td>`;
    html += '</tr>';
  });
  html += '</tbody></table>';
  tableDiv.innerHTML = html;
}

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', async () => {
  await loadTimeRecordsFromServer();
  populateDashboardDropdowns();
  drawDashboardCharts();
  document.getElementById('yearDropdown').addEventListener('change', drawDashboardCharts);
  document.getElementById('monthDropdown').addEventListener('change', drawDashboardCharts);
});

document.getElementById("woImportInput").addEventListener("change", handleWOImport);
