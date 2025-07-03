const BACKEND_URL = "https://mfget-backend.onrender.com";

// --------- DROPDOWN ALERT ---------
document.querySelectorAll('.dropdown-content a').forEach(item => {
  item.addEventListener('click', event => {
    alert('Navigating to: ' + event.target.textContent);
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


// Example: Save time records
async function saveTimeRecords(records) {
  await fetch('https://your-backend-domain.com/api/timeRecords', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(records)
  });
}

// Example: Load time records
async function loadTimeRecords() {
  const resp = await fetch('https://your-backend-domain.com/api/timeRecords');
  return await resp.json();
}
