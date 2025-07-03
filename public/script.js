const BACKEND_URL = "https://mfget-backend.onrender.com";

// --------- DROPDOWN ALERT ---------
document.querySelectorAll('.dropdown-content a').forEach(item => {
  item.addEventListener('click', event => {
    alert('Navigating to: ' + event.target.textContent);
  });
});

// --------- TAB LOGIC ---------
const TAB_IDS = ["timeFormView", "recordsView", "woView", "adminView"];

function hideAllTabs() {
  TAB_IDS.forEach(id => {
    let tab = document.querySelector(`[data-target='${id}']`);
    if (tab) tab.style.display = "none";
  });
}
function showTabsByPermissions(user) {
  if (!user) return;
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
  if (user.userID === "admin") {
    let tab = document.querySelector(`[data-target='adminView']`);
    if (tab) tab.style.display = "";
  }
}

// --------- LOGIN LOGIC ---------
window._userAccess = null;

document.addEventListener("DOMContentLoaded", function () {
  hideAllTabs(); // On load, hide all tabs

  // Login handler
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
        const res = await fetch(`${BACKEND_URL}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userID: user, password: pass })
        });
        const data = await res.json();

        if (data.success) {
          window._userAccess = data.user;
          showTabsByPermissions(data.user);
          document.getElementById("signoutBtn").style.display = "";
          document.getElementById("signinBtn").style.display = "none";
          document.getElementById("username").disabled = true;
          document.getElementById("password").disabled = true;
          alert("✅ Login successful!");
        } else {
          alert("❌ Invalid username or password.");
        }
      } catch (err) {
        alert("❌ Login error! Server might be down.");
        console.error(err);
      }
    };
  }

  // Enable Enter key for login
  ["username", "password"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("keyup", function (e) {
        if (e.key === "Enter") {
          document.getElementById("signinBtn").click();
        }
      });
    }
  });

  // Sign Out handler
  const signoutBtn = document.getElementById("signoutBtn");
  if (signoutBtn) {
    signoutBtn.onclick = function () {
      window._userAccess = null;
      document.getElementById("signoutBtn").style.display = "none";
      document.getElementById("signinBtn").style.display = "";
      document.getElementById("username").value = "";
      document.getElementById("password").value = "";
      document.getElementById("username").disabled = false;
      document.getElementById("password").disabled = false;
      hideAllTabs();
      alert("Signed out.");
    };
  }

  // By default, sign out button should be hidden
  if (signoutBtn) signoutBtn.style.display = "none";
});

// --------- OPTIONAL: Example for Navigation (Show/Hide Sections) ---------
// This assumes you use data-target attributes on your menu links for switching views.
// You can expand this as per your app needs.
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', function () {
    const viewId = this.getAttribute('data-target');
    document.querySelectorAll('.view-section').forEach(view => view.classList.add('hidden'));
    if (viewId && document.getElementById(viewId)) {
      document.getElementById(viewId).classList.remove('hidden');
    }
  });
});


document.getElementById("signinBtn").onclick = async function () {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();

  if (!user || !pass) {
    alert("Please enter username and password.");
    return;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userID: user, password: pass })
    });
    const data = await res.json();

    if (data.success) {
      alert("✅ Login successful!");
      // Hide/show tabs or sections based on permissions
      // For example: setTabsBasedOnPermissions(data.user);
      // document.getElementById("signoutBtn").style.display = "";
      // document.getElementById("signinBtn").style.display = "none";
      // document.getElementById("username").disabled = true;
      // document.getElementById("password").disabled = true;
    } else {
      alert("❌ Invalid username or password.");
    }
  } catch (err) {
    alert("❌ Login error! Server might be down.");
    console.error(err);
  }
};



// Dropdown alert (existing behavior)
document.querySelectorAll('.dropdown-content a').forEach(item => {
  item.addEventListener('click', event => {
    alert('Navigating to: ' + event.target.textContent);
  });
});

// Enquiry form submission logic
const enquiryForm = document.getElementById('enquiryForm');
if (enquiryForm) {
  enquiryForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const tool = document.getElementById('toolType').value;

    fetch("https://mfget-backend.onrender.com/save-enquiry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ toolType: tool })
    })
    .then(res => {
      if (!res.ok) throw new Error("Network response was not OK");
      return res.json();
    })
    .then(data => {
      alert("✅ Enquiry sent: " + data.message);
    })
    .catch(error => {
      console.error("❌ Error sending enquiry:", error);
      alert("❌ Failed to send enquiry. Please try again.");
    });
  });
}


// Save time records
async function saveTimeRecords(records) {
  await fetch(`${BACKEND_URL}/api/timeRecords`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(records)
  });
}

// Load time records
async function loadTimeRecords() {
  const resp = await fetch(`${BACKEND_URL}/api/timeRecords`);
  return await resp.json();
}

