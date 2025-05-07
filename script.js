// Toggle submenu with arrow rotation
window.onload = function () {
  showSection("dashboard"); // Set default active menu
};

function toggleTheme() {
  const themeLink = document.getElementById("themeStylesheet");
  const icon = document.getElementById("themeIcon");
  const currentTheme = themeLink.getAttribute("href");

  if (currentTheme === "light.css") {
    console.log("Switching to dark theme");
    themeLink.setAttribute("href", "dark.css");
    icon.classList.remove("fa-sun");
    icon.classList.add("fa-moon");
    localStorage.setItem("theme", "dark");
  } else {
    console.log("Switching to light theme");
    themeLink.setAttribute("href", "light.css");
    icon.classList.remove("fa-moon");
    icon.classList.add("fa-sun");
    localStorage.setItem("theme", "light");
  }
}

document.addEventListener("click", function (e) {
  if (e.target && e.target.id === "did-count") {
    let companyCode = null;
    const fullData = JSON.parse(localStorage.getItem("fullData")) || {};

    if (fullData.data && fullData.data.userType === "superadmin") {
      const companySelect = document.getElementById("companySelect");
      if (companySelect) {
        companyCode = companySelect.value;
      }
    } else {
      companyCode = fullData.data?.company?.code; // For admin, get company code from fullData
    }

    if (!companyCode) return alert("No company code selected!");

    if (!fullData.apikey) return alert("No API key found!");

    const apiKey = fullData.apikey;
    const didUrl = `https://sip5.houstonsupport.com/pbx/proxyapi.php?key=${apiKey}&reqtype=INFO&tenant=${companyCode}&format=json&info=dids`;

    fetch(didUrl)
      .then((response) => response.json())
      .then((data) => {
        // Filter out DIDs with item[13] === "yes"
        const dids = data
          .filter((item) => (item[13] || "").toLowerCase() !== "yes")
          .map((item) => {
            const fullNumber = [item[2], item[3], item[4]].join("");
            const label = item[5] ? `${item[5]} - ${fullNumber}` : fullNumber;
            return label;
          });

        let html = `<div style="max-height:500px;overflow:auto;"><table class="table table-bordered"><thead><tr><th>DID</th></tr></thead><tbody>`;
        dids.forEach((did) => {
          html += `<tr><td>${did}</td></tr>`;
        });
        html += "</tbody></table></div>";

        let modal = document.getElementById("didListModal");
        if (!modal) {
          modal = document.createElement("div");
          modal.id = "didListModal";
          modal.innerHTML = `
            <div style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.4);z-index:9999;display:flex;align-items:center;justify-content:center;">
              <div style="background:#fff;max-width:700px;width:90vw;padding:20px;border-radius:8px;position:relative;">
                <button id="closeDidModal" style="position:absolute;top:10px;right:10px;">&times;</button>
                <h4>DID List</h4>
                <div id="didListContent"></div>
              </div>
            </div>
          `;
          document.body.appendChild(modal);
          modal.querySelector("#closeDidModal").onclick = () => modal.remove();
        }
        modal.querySelector("#didListContent").innerHTML = html;
      })
      .catch(() => {
        alert("Failed to load DID data.");
      });
  }
});
document.addEventListener("click", function (e) {
  if (e.target && e.target.id === "extension-count") {
    // Get company code based on user type
    let companyCode = null;
    const fullData = JSON.parse(localStorage.getItem("fullData")) || {};
    if (fullData.data && fullData.data.userType === "superadmin") {
      const companySelect = document.getElementById("companySelect");
      if (companySelect) {
        companyCode = companySelect.value;
      }
    } else {
      companyCode = fullData.data?.company?.code; // For admin, get company code from fullData
    }
    if (!companyCode) return alert("No company code selected!");

    // let fullData = null;
    try {
      fullData = JSON.parse(localStorage.getItem("fullData"));
    } catch {}
    if (!fullData || !fullData.apikey) return alert("No API key found!");

    const apiKey = fullData.apikey;
    const extUrl = `https://sip5.houstonsupport.com/pbx/proxyapi.php?reqtype=INFO&tenant=${companyCode}&format=json&key=${apiKey}&info=extensions`;
    const userApi = `https://voiceapi.shuklais.com/user/listUser/${companyCode}`;

    Promise.all([
      fetch(extUrl).then((r) => r.json()),
      fetch(userApi).then((r) => r.json()),
    ])
      .then(([extData, userData]) => {
        // Build extension map (remove item 135)
        const extensions = extData.map((item) => ({
          ext: item[134],
        }));
        // Build user map by extension
        const users = (userData.success || []).map((u) => ({
          name: (u.firstName || "") + " " + (u.lastName || ""),
          ext: u.city || "",
          email: u.email || "",
        }));
        // Group users by extension
        const extUserMap = {};
        extensions.forEach((e) => {
          extUserMap[e.ext] = [];
        });
        users.forEach((u) => {
          if (u.ext && extUserMap[u.ext]) {
            extUserMap[u.ext].push(u);
          }
        });

        // Build HTML table (remove name column)
        let html = `<div style="max-height:500px;overflow:auto;"><table class="table table-bordered"><thead><tr><th>Extension</th><th>Users</th></tr></thead><tbody>`;
        extensions.forEach((e) => {
          const userList = extUserMap[e.ext] || [];
          html += `<tr>
        <td>${e.ext}</td>
        <td>${
          userList.length
            ? userList.map((u) => `${u.name} (${u.email})`).join("<br>")
            : "-"
        }</td>
      </tr>`;
        });
        html += "</tbody></table></div>";

        // Show in modal or alert
        let modal = document.getElementById("extensionListModal");
        if (!modal) {
          modal = document.createElement("div");
          modal.id = "extensionListModal";
          modal.innerHTML = `
        <div style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.4);z-index:9999;display:flex;align-items:center;justify-content:center;">
        <div style="background:#fff;max-width:700px;width:90vw;padding:20px;border-radius:8px;position:relative;">
          <button id="closeExtModal" style="position:absolute;top:10px;right:10px;">&times;</button>
          <h4>Extension List</h4>
          <div id="extensionListContent"></div>
        </div>
        </div>
      `;
          document.body.appendChild(modal);
          modal.querySelector("#closeExtModal").onclick = () => modal.remove();
        }
        modal.querySelector("#extensionListContent").innerHTML = html;
      })
      .catch(() => {
        alert("Failed to load extension/user data.");
      });
  }
});
document.addEventListener("DOMContentLoaded", updateSidebarLinks);

//To change section in siderbar on click
function showSection(id) {
  const sections = document.querySelectorAll(".section");
  const menuItems = document.querySelectorAll("#sidebar a");
  sections.forEach((section) => section.classList.add("hidden"));
  const targetSection = document.getElementById(id);
  if (targetSection) {
    targetSection.classList.remove("hidden");
  }

  menuItems.forEach((item) => {
    item.classList.remove("active-menu");
    if (item.getAttribute("data-menu") === id) {
      item.classList.add("active-menu");
    }
  });
}

// Toggle sidebar width and text visibility
function updateSidebarLinks() {
  const menuLinks = document.querySelectorAll("#sidebar a");
  menuLinks.forEach((link) => {
    const menuName = link.textContent.trim().toLowerCase();
    link.setAttribute("data-menu", menuName); // Set the data-menu attribute
  });
}

// to toggle the sidebar
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const textSpans = sidebar.querySelectorAll(".sidebar-text");

  // Toggle width class
  sidebar.classList.toggle("w-64");
  sidebar.classList.toggle("w-20");

  // Toggle text visibility
  textSpans.forEach((span) => {
    span.classList.toggle("hidden");
  });
}

// Function to toggle password visibility
function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  const eyeIcon = document.getElementById(
    inputId === "editExtensionPassword" ? "editEyeIcon" : "eyeIcon"
  );
  if (input.type === "password") {
    input.type = "text";
    eyeIcon.classList.remove("bi-eye");
    eyeIcon.classList.add("bi-eye-slash");
  } else {
    input.type = "password";
    eyeIcon.classList.remove("bi-eye-slash");
    eyeIcon.classList.add("bi-eye");
  }
}

function togglePassword() {
  let passwordField = document.getElementById("passwordnewInput");
  let eyeIcon = document.getElementById("eyeIcon");

  if (passwordField.type === "password") {
    passwordField.type = "text";
    eyeIcon.classList.remove("fa-eye");
    eyeIcon.classList.add("fa-eye-slash"); // Change icon to eye-slash
  } else {
    passwordField.type = "password";
    eyeIcon.classList.remove("fa-eye-slash");
    eyeIcon.classList.add("fa-eye"); // Change back to eye
  }
}

function togglePassworda() {
  let passwordField = document.getElementById("newPwd");
  let eyeIcona = document.getElementById("eyeIcona");

  if (passwordField.type === "password") {
    passwordField.type = "text";
    eyeIcona.classList.remove("fa-eye");
    eyeIcona.classList.add("fa-eye-slash"); // Change icon to eye-slash
  } else {
    passwordField.type = "password";
    eyeIcona.classList.remove("fa-eye-slash");
    eyeIcona.classList.add("fa-eye"); // Change back to eye
  }
}

function togglePasswordb() {
  let passwordField = document.getElementById("cnewPwd");
  let eyeIconb = document.getElementById("eyeIconb");

  if (passwordField.type === "password") {
    passwordField.type = "text";
    eyeIconb.classList.remove("fa-eye");
    eyeIconb.classList.add("fa-eye-slash"); // Change icon to eye-slash
  } else {
    passwordField.type = "password";
    eyeIconb.classList.remove("fa-eye-slash");
    eyeIconb.classList.add("fa-eye"); // Change back to eye
  }
}

//Send user back to Login Back from any page before login
function back() {
  document.getElementById("mainPage").style.display = "block";
  document.getElementById("forgotPasswordModal").style.display = "none";
  document.getElementById("OTPModal").style.display = "none";
  document.getElementById("pwdModal").style.display = "none";
  document.getElementById("tempModal").style.display = "none";
  // logout();
}

//Show Forget Password Page and hide Login Screen Page.
function handleForgetPage() {
  document.getElementById("mainPage").style.display = "none";
  document.getElementById("forgotPasswordModal").style.display = "block";
}

//Checks for Email ID if its there in our database or not!!!
function handleEmail() {
  const email = document.getElementById("usernameForgotInput").value;

  if (!email) {
    Alert("Please enter Email ID", "Error", function () {});
    return;
  }

  fetch("https://voiceapi.shuklais.com/user/resetUserApp", {
    //fetch("http://172.31.199.45:5000/user/resetUserApp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        uuid = data.uuid;
        //console.log(data);
        //console.log("UUID received:", uuid);
        handleOtp(email);
      } else if (data.error) {
        Alert(data.error);
      } else {
        Alert("Unexpected response. Please try again.");
      }
    })
    .catch((error) => {
      console.error("Request failed:", error);
      Alert("Network error. Please try again.");
    });
}

//Show OTP page after entering EmailID
function handleOtp() {
  document.getElementById("mainPage").style.display = "none";
  document.getElementById("forgotPasswordModal").style.display = "none";
  document.getElementById("OTPModal").style.display = "block";
  startOtpTimer();
}

//Start Otp timer
function startOtpTimer() {
  let timeLeft = 60;
  const timerDisplay = document.getElementById("otpTimer");

  timerDisplay.textContent = `01:00`;

  timerInterval = setInterval(() => {
    timeLeft--;

    const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const seconds = String(timeLeft % 60).padStart(2, "0");
    timerDisplay.textContent = `${minutes}:${seconds}`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerDisplay.textContent = `OTP expired`;

      // Call the expire API
      fetch(`${apiUrl}user/otpexpire/`, {
        method: "GET",
      })
        .then((response) => response.json())
        .then((data) => console.log("OTP expired:", data))
        .catch((err) => console.error("Expire call failed:", err));
      location.reload();
    }
  }, 1000);
}

//Verify OTP
function validateOtp() {
  const otp = document.getElementById("otpInput").value.trim();
  const email = document.getElementById("usernameForgotInput").value;
  if (!otp) {
    Alert("Please enter OTP to proceed", "Error", function () {});
    return;
  }

  fetch("https://voiceapi.shuklais.com/user/resetUserApp", {
    //fetch("http://172.31.199.45:5000/user/resetUserApp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email,
      otp: otp,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        clearInterval(timerInterval);
        //console.log("Correct OTP");
        handlePasswordPage(email); // Proceed to password reset
      } else {
        Alert(
          data.error || "Incorrect OTP. Try again.",
          "Error",
          function () {}
        );
      }
    })
    .catch((err) => {
      console.error("OTP validation failed:", err);
      Alert(data.error || "Incorrect OTP. Try again.", "Error", function () {});
    });
}

//Show Password Page after OTP Verification
function handlePasswordPage(email) {
  //console.log("OTP", email);
  document.getElementById("mainPage").style.display = "none";
  document.getElementById("forgotPasswordModal").style.display = "none";
  document.getElementById("OTPModal").style.display = "none";
  document.getElementById("pwdModal").style.display = "block";
}

//Change Password Page from Login Screen
function changePwd() {
  const email = document.getElementById("usernameForgotInput").value;
  const pwd = document.getElementById("newPwd").value;
  //console.log("pwd", pwd);
  const rpwd = document.getElementById("cnewPwd").value;
  //console.log("rpwd", rpwd);

  if (!pwd) {
    Alert("Please enter the Password.");
    return;
  }
  if (pwd != rpwd) {
    Alert("Password Doesnot match");
    return;
  }
  fetch("https://voiceapi.shuklais.com/user/resetUserApp", {
    //fetch("http://172.31.199.45:5000/user/resetUserApp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email,
      password: pwd,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        //console.log("Password Change");
        Alert(
          "Your Password has changed successfully. Press OK to continue",
          "Success",
          function () {
            //console.log("OK pressed!");
            back();
          }
        );
      } else {
        Alert(data.error || "Try again.");
      }
    })
    .catch((err) => {
      console.error("Password change failed:", err);
      Alert("Password change failed. Try Again", "Error!", function () {
        back();
      });
    });
}

//Process after clicking on Login Button
function handleLogin() {
  let button = document.getElementById("loginSubmit");
  button.innerText = "Please wait...";
  button.disabled = true; // Prevent multiple clicks

  // Call actual login function
  loginuser();

  // (Optional) If login takes time, reset text after some delay
  setTimeout(() => {
    button.innerText = "Login";
    button.disabled = false;
    // autosign();
  }, 3000); // Adjust delay as needed
}

//Handle Email id and Password Verification
function loginuser() {
  //console.log("calling login userrrrrrrrrr");
  const username = document.getElementById("usernamenewInput").value;
  //console.log(username);
  const password = document.getElementById("passwordnewInput").value;
  //console.log(password);
  if (username == "" || password == "") {
    LoginAlert(lang.alert_login, lang.retry_login, function () {});
    return;
  }
  fetch("https://voiceapi.shuklais.com/user/userlogin", {
    //fetch("http://172.31.199.45:5000/user/userlogin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: username, password: password }),
  })
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then((data) => {
      //console.log("response data", data);
      if (data.success) {
        let fullData = data;
        let sdata = data.data;
        let fullName = data.data.firstName + " " + data.data.lastName;
        let email = data.data.email;
        let userType = data.data.userType;
        //console.log(userType);
        localStorage.setItem("fullData", JSON.stringify(fullData));
        localStorage.setItem("sdata", JSON.stringify(sdata));
        localStorage.setItem("fullName", JSON.stringify(fullName));
        localStorage.setItem("email", JSON.stringify(email));
        if (data.message == "New Login") {
          //console.log("NEW LOGIN");
          tempPass();
        } else {
          // loadScript("script.js");
          setupDashboard(userType);
        }
      } else {
        console.error("Error:", data.error);
        // Alert("Inncorrect Email or Password.", "Try Again", function () {
        //   //console.log("OK pressed!");
        // });

        //showNotification();
      }
    })
    .catch((error) => {
      //console.log("403 Email Error", error);
      //showNotification();
    });
}

//For Fresh Login, after
function tempPass() {
  document.getElementById("mainPage").style.display = "none";
  document.getElementById("tempModal").style.display = "block";
}
//This function changes password of user desired
function changeTemp() {
  let storedemail = JSON.parse(localStorage.getItem("email"));
  const tpwd = document.getElementById("tPwd").value;
  //console.log("pwd", tpwd);
  const rtpwd = document.getElementById("tnewPwd").value;
  //console.log("rpwd", rtpwd);

  if (!tpwd) {
    // Alert("Please enter the Password.");
    return;
  }
  if (tpwd != rtpwd) {
    // Alert("Password Doesnot match");
    return;
  }
  fetch("https://voiceapi.shuklais.com/user/resetUserApp", {
    //fetch("https://172.31.199.45:5000/user/resetUserApp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: storedemail,
      password: tpwd,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        //console.log("Password Change");
        location.reload();
        // Alert(
        //   "Your Password has changed successfully. Press OK to continue",
        //   "Success",
        //   function () {
        //     //console.log("OK pressed!");
        //     back();
        //   }
        // );
      } else {
        // Alert(data.error || "Try again.");
      }
    })
    .catch((err) => {
      console.error("Password change failed:", err);
      // Alert("Password change failed. Try Again", "Error!", function () {
      //   back();
      // });
    });
}

function loadScript(src) {
  const script = document.createElement("script");
  script.src = src;
  script.type = "text/javascript";
  script.defer = true;
  document.body.appendChild(script);
}

//Check whether user is Admin or Super Admin
function setupDashboard(userType) {
  //console.log(userType);
  const superadminDiv = document.getElementById("superadmin");
  const adminDiv = document.getElementById("admin");

  if (userType === "superadmin") {
    superadminDiv.classList.remove("hidden");
    adminDiv.classList.add("hidden");
    document.getElementById("loginModal").style.display = "none";
    document.getElementById("superadmin").style.display = "contents";
    // Example: Append HTML to the #superadmin div
    const superDiv = document.getElementById("superadmin");
    const newDiv = document.createElement("div");
    newDiv.style.display = "contents";
    newDiv.innerHTML = ` <!-- Sidebar -->
      <aside id="sidebar" class="w-64 asideside hidden md:block transition-all duration-300 bg-gray-900 text-white">
    <!-- Logo & Toggle Button -->
    <div class="p-6 text-xl text-white flex items-center justify-center relative">
        <img src="logophoneihs.png" alt="Logo" class="h-10">
    </div>

    <!-- Nav Links -->
    <nav class="mt-2">
        <a href="#" onclick="showSection('dashboard')" class="block px-7 py-3 no-underline flex items-center space-x-2">
            <i class="fas fa-tachometer-alt mr-2"></i>
            <span class="sidebar-text">Dashboard</span>
        </a>
        <a href="#" onclick="showSection('users')" class="block px-7 py-3 no-underline flex items-center space-x-2">
            <i class="fas fa-users mr-2"></i>
            <span class="sidebar-text">Users</span>
        </a>
    </nav>
</aside>
<!-- Main content area -->
<div class="d-flex flex-column flex-grow-1">
    <!-- Topbar -->
    <header class="d-flex justify-content-between align-items-center p-3 border-bottom">
        <!-- Left: Toggle Button -->
        <div class="d-flex align-items-center">
            <button onclick="toggleSidebar()" class="btn btn-link text-dark fs-4 me-3">
                <i class="fas fa-bars"></i>
            </button>
        </div>

        <!-- Center: Company Select -->
        <div class="flex-grow-1 d-flex justify-content-center">
            <select id="companySelect" class="form-select w-auto">
                <option selected>Accu Financials</option>
                <!-- other options -->
            </select>
        </div>

        <!-- Right: Theme + Sign Out -->
        <div class="d-flex align-items-center gap-3">
            
            <button onclick="localStorage.clear(); location.reload();" class="btn btn-link p-0 text-dark fs-4">
                <i class="fa fa-sign-out"></i>
            </button>
        </div>
    </header>


    <!-- Topbar -->
    <!-- Main Content with all static HTML -->
    <main id="mainContent" class="p-4 flex-1 space-y-10 main">
  <!-- Dashboard Section -->
  <section id="dashboard" class="section">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white dark:bg-gray-800 p-3 shadow rounded-xl">
        <h4 class="text-gray-600 dark:text-gray-300">Users</h4>
        <p id="user-count" onclick="showSection('users')" class="text-2xl font-bold text-indigo-600" style="
          cursor: pointer;
          ">Loading...</p>

      </div>
      <div class="bg-white dark:bg-gray-800 p-3 shadow rounded-xl">
        <h4 class="text-gray-600 dark:text-gray-300">Extension</h4>
        <p id="extension-count" class="text-2xl font-bold text-green-600" style="
          cursor: pointer;
          ">Loading...</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-3 shadow rounded-xl">
        <h4 class="text-gray-600 dark:text-gray-300">DIDs</h4>
        <p id="did-count" class="text-2xl font-bold text-blue-600" style="
          cursor: pointer;
          ">Loading...</p>
      </div>
    </div>
     <div class="bg-white dark:bg-gray-800 p-3 shadow rounded-xl mt-2">
        <div class="row">
          <div>
          <label for="predefinedRange">Select Range: </label>
            <select id="predefinedRange">
              <option value="">-- Choose --</option>
              <option value="today" selected>Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="thisWeek">This Week</option>
              <option value="thisMonth">This Month</option>
            </select>
            <label for="startDate">Start Date:</label>
            <input type="date" id="startDate">
            <label for="endDate">End Date:</label>
            <input type="date" id="endDate">
            <label for="extensionFilter">Extension:</label>
            <select id="extensionFilter" onchange="applyFilters()">
              <option value="">All</option>
            </select>

            <label for="directionFilter">Direction:</label>
            <select id="directionFilter" onchange="applyFilters()">
              <option value="">All</option>
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
            </select>

            <label for="statusFilter">Status:</label>
            <select id="statusFilter" onchange="applyFilters()">
              <option value="">All</option>
            </select>

            <label>
              <input type="checkbox" id="hideVoicemail" checked onchange="applyFilters()">
              Hide Voicemail
            </label>
       
            
            <button onclick="filterByDate()" class="btn btn-outline-dark">Apply</button>
          </div>
        </div>
        </div>
    <div class="grid grid-cols-1 mt-2 col-12">
      <div class="bg-white dark:bg-gray-800 p-3 shadow rounded-xl mt-2">
    <div style="display: flex; gap: 20px; margin-top: 20px;">
  <div style="flex: 1;">
    <h3>Inbound Calls</h3>
    <canvas id="inboundChart"></canvas>
  </div>
  <div style="flex: 1;">
    <h3>Outbound Calls</h3>
    <canvas id="outboundChart"></canvas>
  </div>
</div>

      </div>
     
      <div class="bg-white dark:bg-gray-800 p-3 shadow rounded-xl mt-2">

        <div class="row">
          <div class="col-12">
            <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
              <table class="table table-bordered" id="combinedTable">
                <thead class="table-light" style="
                                position: sticky;
                                top: 0;
                                z-index: 1; /* Ensure it stays above other rows */
                                background-color: white;
                            ">
                  <tr>
                    <th>Extension</th>
                    <th>Caller Name</th>
                    <th>Caller Number</th>
                    <th>Receiver</th>
                    <th>Date & Time</th>
                    <th>Duration</th>
                    <th>Direction</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody id="call-logs-body">
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
  </section>
  <!-- Users Section -->
  <section id="users" class="section hidden">
    <div class="flex justify-between items-center mb-2">
      <!-- Search Bar -->
      <input type="text" id="searchInput" class="form-control w-64" style="width: 89% !important;"
        placeholder="Search...">
      <!-- Add User Button -->
      <button id="openAddUserModal"
        class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600">
        Add User
      </button>
    </div>

    <div class="table-responsive">
      <table class="table table-bordered" id="userTable">
        <thead class="table-light">
          <tr>
            <th class="text-center px-4 py-2 fcolor">First Name</th>
            <th class="text-center px-4 py-2 fcolor">Last Name</th>
            <th class="text-center px-4 py-2 fcolor">Email</th>
            <th class="text-center px-4 py-2 fcolor">User Type</th>
            <th class="text-center px-4 py-2 fcolor">Is Active</th>
            <th class="text-center px-4 py-2 fcolor">Extension Name</th>
            <th class="text-center px-4 py-2 fcolor">Actions</th>
          </tr>
        </thead>
        <tbody id="tableBody">
          <!-- Table rows from API response will be inserted here -->
        </tbody>
      </table>
    </div>
  </section>


</main>
    <!-- Add User Modal -->
    <div class="modal fade dark-mode" id="addUserModal" tabindex="-1" aria-labelledby="addUserModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="addUserModalLabel">Add User</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="firstName" class="form-label mb-0">First Name</label>
                                <input type="text" class="form-control" id="firstName" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="lastName" class="form-label mb-0">Last Name</label>
                                <input type="text" class="form-control" id="lastName" required>
                            </div>
                            <div class="col-md-12 mb-3">
                                <label for="userType" class="form-label mb-0">User Type</label>
                                <select class="form-select" id="userType" required>
                                    <option value="superadmin">Super Admin</option>
                                    <option value="admin">Admin</option>
                                    <option value="user">User</option>
                                </select>
                            </div>
                            <div class="col-md-12 mb-3">
                                <label for="email" class="form-label mb-0">Email</label>
                                <input type="email" class="form-control" id="addEmail" required>
                            </div>
                            <div class="col-md-12 mb-3">
                                <label for="wssServer" class="form-label mb-0">SIP DOMAIN</label>
                                <select class="form-select" id="wssServer" required>
                                    <option value="sip2.houstonsupport.com">SIP 2</option>
                                    <option value="sip5.houstonsupport.com">SIP 5</option>
                                </select>
                            </div>

                            <!-- Extension Dropdown -->
                            <div class="col-md-6 mb-3">
                                <label for="addextensionSelect" class="form-label">Select Extension</label>
                                <select id="addextensionSelect" class="form-select" required>
                                    <option value="">-- Select Extension --</option>
                                </select>
                            </div>
                            <!-- DID Selection (Checkbox List) -->
                            <div class="col-md-6 mb-3">
                                <label for="adddidSelect" class="form-label mb-0">Select DIDs</label>
                                <div id="adddidSelect" style="height: 178px;overflow: scroll; overflow-x: hidden;">
                                </div>
                                <!-- Container for DIDs checkboxes -->
                            </div>

                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" id="addUserBtn">Save User</button>
                </div>
            </div>
        </div>
    </div>
    <!-- Edit User Modal -->
    <div class="modal fade dark-mode" id="editUserModal" tabindex="-1" aria-labelledby="editUserModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <!-- Increased modal width -->
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="editUserModalLabel">Edit User</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="editFirstName" class="form-label">First Name</label>
                                <input type="text" class="form-control" id="editFirstName" required />
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="editLastName" class="form-label">Last Name</label>
                                <input type="text" class="form-control" id="editLastName" required />
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="isActiveCheckbox">Is Active</label>
                                <input type="checkbox" id="isActiveCheckbox">
                            </div>
                            <div class="col-md-12 mb-3">
                                <label for="editUserType" class="form-label">User Type</label>
                                <select class="form-select" id="editUserType" required>
                                    <option value="superadmin">Super Admin</option>
                                    <option value="admin">Admin</option>
                                    <option value="user">User</option>
                                </select>
                            </div>
                            <div class="col-md-12 mb-3">
                                <label for="editEmail" class="form-label">Email</label>
                                <input type="email" class="form-control" id="editEmail" required />
                            </div>

                            <div class="col-md-12 mb-3" id="passwordSection">
                                <label class="form-label">Password</label><br>
                                <button type="button" class="btn btn-outline-primary" id="changePasswordBtn">
                                    Change Password
                                </button>
                                <div id="passwordEditControls" style="display: none; margin-top: 10px;">
                                    <div class="input-group mb-2">
                                        <input type="password" class="form-control" id="editPasswordInput"
                                            placeholder="Enter new password" />
                                        <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                                            <i class="fa-solid fa-eye" id="eyeIcon"></i>
                                        </button>
                                    </div>
                                    <div class="d-flex gap-2">
                                        <button type="submit" class="btn btn-success"
                                            id="submitPasswordBtn">Submit</button>
                                        <button type="button" class="btn btn-secondary"
                                            id="cancelPasswordBtn">Cancel</button>
                                    </div>
                                </div>
                            </div>

                            <div class="col-md-12 mb-3">
                                <label for="editWss" class="form-label">SIP DOMAIN</label>
                                <select class="form-select" id="editWss" required>
                                    <option value="sip2.houstonsupport.com">SIP 2</option>
                                    <option value="sip5.houstonsupport.com">SIP 5</option>
                                </select>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label for="extensionSelect" class="form-label">Select Extension</label>
                                <select id="extensionSelect" class="form-select">
                                    <option value="">-- Select Extension --</option>
                                </select>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="didSelect" class="form-label">Select DIDs</label>
                                <div id="didSelect" style="height: 178px;overflow: scroll; overflow-x: hidden;">
                                    <!-- Checkbox items will be appended here -->
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        Close
                    </button>
                    <button type="button" class="btn btn-primary" id="saveBtn">Save Changes</button>
                </div>
            </div>
        </div>
    </div>

</div>`;
    superDiv.appendChild(newDiv);
    //const apiUrl = "http://172.31.199.45:5000";
    const apiUrl = "https://voiceapi.shuklais.com";

    let userMap = new Map();
    const fullData = JSON.parse(localStorage.getItem("fullData"));
    let inboundChartInstance;
    let outboundChartInstance;
    
    fetch(`${apiUrl}/company/listCompany`)
      .then((res) => res.json())
      .then((data) => {
        const select = document.getElementById("companySelect");
        select.innerHTML = "";
        const sortedCompanies = data.success.sort((a, b) =>
          a.companyName.localeCompare(b.companyName)
        );

        sortedCompanies.forEach((company, index) => {
          const option = document.createElement("option");
          option.value = company.code;
          option.text = company.companyName;
          option.dataset.id = company.id; // Store id

          if (index === 0) {
            option.selected = true;
            //console.log("company.code", company.code);
            fetchUsers(company.code);
            //console.log("company.id", company.id);
            localStorage.setItem("companyCode", company.code);
            localStorage.setItem("companyId", company.id);
          }

          select.appendChild(option);
        });

        // Convert native select to jQuery object for Select2
        const $select = $(select);

        // Initialize Select2
        $select.select2({
          placeholder: "Select a company",
          allowClear: true,
          sorter: (data) => data.sort((a, b) => a.text.localeCompare(b.text)),
        });

        // Handle change event
        $select.on("change", function () {
          localStorage.setItem("companyCode", " ");
          const selectedOption = this.options[this.selectedIndex];
          const selectedId = selectedOption.dataset.id;
          const selectedCompanyCode = this.value;
          // fetchData(selectedCompanyCode)
          fetchUsers(selectedCompanyCode);
          fetchExt(selectedCompanyCode);
          fetchDid(selectedCompanyCode);
          //console.log("selectedCompanyCode", selectedCompanyCode);
          localStorage.setItem("selectedCompanyCode", selectedCompanyCode);
          localStorage.setItem("companyCode", selectedCompanyCode);
          console.log("selectedCompanyCode", selectedCompanyCode);
          localStorage.setItem("companyId", selectedId);
        });
      })
      .catch((error) => console.error("Error fetching companies:", error));

    // Function to fetch users based on selected company code
    function fetchUsers(selectedCompanyCode) {
      localStorage.setItem;
      //console.log("Fetching extensions for:", selectedCompanyCode);
      fetch(`${apiUrl}/user/listUser/${selectedCompanyCode}`)
        .then((res) => res.json())
        .then((data) => {
          const users = data.success || [];
          userMap.clear();

          const userCountElement = document.getElementById("user-count");
          if (userCountElement) {
            userCountElement.textContent = users.length.toLocaleString();
          }

          users.forEach((user) => userMap.set(user.uuid, user));
          renderUsers(users);
          fetchExt(selectedCompanyCode);
          // fetchCDR(selectedCompanyCode)
          fetchDid(selectedCompanyCode);
          // fetchData(selectedCompanyCode);
        })
        .catch((error) => console.error("Error fetching users:", error));
    }
    // Fetch extensions to display them on dashboard
    function fetchExt(selectedCompanyCode) {
      const tenant = selectedCompanyCode;
      const apiKey = fullData.apikey;
      const extUrl = `https://sip5.houstonsupport.com/pbx/proxyapi.php?reqtype=INFO&tenant=${tenant}&format=json&key=${apiKey}&info=extensions`;

      fetch(extUrl)
        .then((response) => response.json())
        .then((data) => {
          extensionData = data.map((item) => ({
            value134: item[134],
          }));

          const value132Set = [
            ...new Set(extensionData.map((item) => item.value134)),
          ];
          const extensionCount = value132Set.length;

          const extCountElement = document.getElementById("extension-count");
          if (extCountElement) {
            extCountElement.textContent = extensionCount.toLocaleString();
          }
        })
        .catch((error) => console.error("Error fetching extensions:", error));
    }
    // Fetch dids to display them on dashboard
    function fetchDid(selectedCompanyCode) {
      const tenant = selectedCompanyCode;
      const apiKey = fullData.apikey; // Replace with real key
      const didUrl = `https://sip5.houstonsupport.com/pbx/proxyapi.php?key=${apiKey}&reqtype=INFO&tenant=${tenant}&format=json&info=dids`;

      fetch(didUrl)
        .then((response) => response.json())
        .then((data) => {
          const didCount = data.length || 0;
          //console.log("DIDs:", data);
          //console.log("Total DIDs:", didCount);

          // ✅ Use getElementById instead of querySelector
          const didCountElement = document.getElementById("did-count");
          if (didCountElement) {
            didCountElement.textContent = didCount.toLocaleString();
          }
        })
        .catch((error) => {
          console.error("Error fetching DIDs:", error);
        });
    }

    const apiKey = fullData?.apikey;
    const tenant = localStorage.getItem("companyCode");
    console.log("tenant", tenant);

    let statusByDateChartInstance;

    let originalData = [];
    const isLoader = "true";
    document
      .getElementById("predefinedRange")
      .addEventListener("change", function () {
        const today = new Date();
        let start, end;

        switch (this.value) {
          case "today":
            start = new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate()
            );
            end = new Date(); // current time
            break;
          case "yesterday":
            start = end = new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate() - 1
            );
            break;
          case "thisWeek":
            const firstDayOfWeek = new Date(
              today.setDate(today.getDate() - today.getDay())
            );
            start = new Date(
              firstDayOfWeek.getFullYear(),
              firstDayOfWeek.getMonth(),
              firstDayOfWeek.getDate()
            );
            end = new Date();
            break;
          case "thisMonth":
            start = new Date(today.getFullYear(), today.getMonth(), 1);
            end = new Date();
            break;
          default:
            return;
        }

        document.getElementById("startDate").value = formatDate(start);
        document.getElementById("endDate").value = formatDate(end);

        filterByDate(); // Automatically fetch data
      });

    function formatDate(date) {
      return date.toISOString().split("T")[0];
    }
    function filterByDate() {
      const start = document.getElementById("startDate").value;
      const end = document.getElementById("endDate").value;

      if (!start || !end) {
        alert("Please select both start and end dates.");
        return;
      }

      const selectedRange = document.getElementById("predefinedRange").value;
      let startDateTime = `${start} 00:00`;
      let endDateTime;

      if (selectedRange === "today") {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, "0");
        const minutes = now.getMinutes().toString().padStart(2, "0");
        endDateTime = `${end} ${hours}:${minutes}`;
      } else {
        endDateTime = `${end} 23:59`;
      }

      fetchData(startDateTime, endDateTime);
    }
    // Attach to the global window object
    window.filterByDate = filterByDate;
    function fetchData(startDateTime, endDateTime) {
      const url = `https://sip5.houstonsupport.com/pbx/proxyapi.php?reqtype=INFO&info=cdrs&tenant=gmd&key=trL9cGpdP6WW9Y9z&format=json&start=${encodeURIComponent(
        startDateTime
      )}&end=${encodeURIComponent(endDateTime)}`;

      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          console.log("API response:", data);
          renderTable(data);

          const start = startDateTime.split(" ")[0];
          const end = endDateTime.split(" ")[0];
          renderSeparateDirectionCharts(data, start.split(' ')[0], end.split(' ')[0]);

        })
        .catch((err) => console.error("API error:", err));
    }

    function parseCallerName(clid) {
      if (!clid) {
        return "-"; // If clid is undefined or null, return '-'
      }
      const match = clid.match(/"([^"]+)"/);
      return match ? match[1] : "-"; // If a match is found, return the caller name, otherwise return '-'
    }
    function extractNumber(value) {
      // Match only digits (numbers)
      const match = value.match(/\d+/);
      return match ? match[0] : "-"; // Return the first match or '-' if no match
    }

    function renderTable(data) {
      if (!Array.isArray(data)) {
        console.error("Expected an array of call logs, but got:", data);
        return;
      }

      originalData = data; // Save full data for filtering

      // Populate filter dropdowns (filtered list)
      const extSet = new Set();
      const statusSet = new Set();

      const hideVoicemail = document.getElementById("hideVoicemail").checked;

      data.forEach((item) => {
        let callerExtRaw =
          item.userfield === "[inbound]"
            ? item.wherelanded
            : extractNumber(item.realsrc);
        let callerExt = callerExtRaw || "N/A";
        if (callerExt === "N/A") return;

        if (!hideVoicemail || !callerExt.toLowerCase().includes("voicemail")) {
          extSet.add(callerExt);
        }

        statusSet.add(item.disposition || "-");
      });

      const extFilter = document.getElementById("extensionFilter");
      const statusFilter = document.getElementById("statusFilter");

      extFilter.innerHTML = '<option value="">All</option>';
      statusFilter.innerHTML = '<option value="">All</option>';

      extSet.forEach(
        (ext) =>
          (extFilter.innerHTML += `<option value="${ext}">${ext}</option>`)
      );
      statusSet.forEach(
        (status) =>
          (statusFilter.innerHTML += `<option value="${status}">${status}</option>`)
      );

      applyFilters();
    }

    function applyFilters() {
      const extVal = document.getElementById("extensionFilter").value;
      const dirVal = document.getElementById("directionFilter").value;
      const statusVal = document.getElementById("statusFilter").value;
      const hideVoicemail = document.getElementById("hideVoicemail").checked;

      const filtered = originalData.filter((item) => {
        let callerExtRaw =
          item.userfield === "[inbound]"
            ? item.wherelanded
            : extractNumber(item.realsrc);
        let callerExt = callerExtRaw || "N/A";
        if (callerExt === "N/A") return false;

        if (hideVoicemail && callerExt.toLowerCase().includes("voicemail"))
          return false;

        let direction =
          item.userfield === "[inbound]"
            ? "IN"
            : item.userfield === "[outbound]"
            ? "OUT"
            : "-";
        let status = item.disposition || "-";

        return (
          (!extVal || callerExt === extVal) &&
          (!dirVal || direction === dirVal) &&
          (!statusVal || status === statusVal)
        );
      });

      // Render filtered table
      let tableBody = document.getElementById("call-logs-body");
      let tableRows = "";

      filtered.forEach((item) => {
        let callerName = parseCallerName(item.clid);
        let callerExtRaw =
          item.userfield === "[inbound]"
            ? item.wherelanded
            : extractNumber(item.realsrc);
        let callerExt = callerExtRaw || "N/A";
        let callerNumber = item.src || "-";
        let receiver = item.dst || "-";
        let dateTime = item.start || "-";
        let duration = item.duration || "-";
        let direction =
          item.userfield === "[inbound]"
            ? "IN"
            : item.userfield === "[outbound]"
            ? "OUT"
            : "-";
        let status = item.disposition || "-";

        tableRows += `
<tr>
<td>${callerExt}</td>
<td>${callerName}</td>
<td>${callerNumber}</td>
<td>${receiver}</td>
<td>${dateTime}</td>
<td>${duration}</td>
<td>${direction}</td>
<td>${status}</td>
</tr>
`;
      });

      tableBody.innerHTML = tableRows;

      // ✅ Re-render chart with filtered data
      const startDate = document.getElementById("startDate").value;
      const endDate = document.getElementById("endDate").value;
      renderSeparateDirectionCharts(filtered, startDate, endDate);

    }
    window.applyFilters = applyFilters;
    function renderSeparateDirectionCharts(data, startDate, endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
    
      const groupByDateAndStatus = (filterDirection) => {
        const dateMap = {};
        const statusSet = new Set();
    
        data.forEach(item => {
          const rawDate = new Date(item.start);
          if (rawDate >= start && rawDate <= end) {
            const direction = item.userfield === '[inbound]' ? 'IN' : item.userfield === '[outbound]' ? 'OUT' : 'UNKNOWN';
            if (direction !== filterDirection) return;
    
            const dateStr = rawDate.toISOString().split('T')[0];
            const status = item.disposition || 'Unknown';
            statusSet.add(status);
    
            if (!dateMap[dateStr]) dateMap[dateStr] = {};
            if (!dateMap[dateStr][status]) dateMap[dateStr][status] = 0;
            dateMap[dateStr][status]++;
          }
        });
    
        const sortedDates = Object.keys(dateMap).sort();
        const statusList = Array.from(statusSet);
        const datasets = statusList.map((status, i) => ({
          label: status,
          data: sortedDates.map(date => dateMap[date][status] || 0),
          backgroundColor: `hsl(${i * 40}, 70%, 60%)`
        }));
    
        return { labels: sortedDates, datasets };
      };
    
      const inData = groupByDateAndStatus('IN');
      const outData = groupByDateAndStatus('OUT');
    
      // Destroy existing charts
      if (inboundChartInstance) inboundChartInstance.destroy();
      if (outboundChartInstance) outboundChartInstance.destroy();
    
      const inCtx = document.getElementById('inboundChart').getContext('2d');
      const outCtx = document.getElementById('outboundChart').getContext('2d');
    
      inboundChartInstance = new Chart(inCtx, {
        type: 'bar',
        data: {
          labels: inData.labels,
          datasets: inData.datasets
        },
        options: {
          plugins: {
            title: { display: true, text: 'Inbound Status by Day' }
          },
          responsive: true,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    
      outboundChartInstance = new Chart(outCtx, {
        type: 'bar',
        data: {
          labels: outData.labels,
          datasets: outData.datasets
        },
        options: {
          plugins: {
            title: { display: true, text: 'Outbound Status by Day' }
          },
          responsive: true,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }
    
    function renderUsers(users) {
      const tbody = document.querySelector("#userTable tbody");
      const fragment = document.createDocumentFragment();
      tbody.innerHTML = "";

      users.forEach((user) => {
        const ext = user.extension?.[0] || {};
        const row = document.createElement("tr");
        row.className = "odd:bg-gray-50 dark:odd:bg-gray-700";
        row.style.cursor = "pointer";
        row.onclick = () => editUserById(user.uuid);
        //console.log("infoinrow", user);
        row.innerHTML = `
      <td class="text-center px-4 py-1">${user.firstName || ""}</td>
      <td class="text-center px-4 py-1">${user.lastName || ""}</td>
      <td class="text-center px-4 py-1">${user.email || ""}</td>
      <td class="text-center px-4 py-1">${user.userType || ""}</td>
      <td class="text-center px-4 py-1">${user.is_active ? "Yes" : "No"}</td>
      <td class="text-center px-4 py-1">${user.city || "-"}</td>
      <td class="text-center px-4 py-1 flex justify-center">
        <button class="btn btn-sm btn-success" onclick='event.stopPropagation(); sendUserById("${
          user.uuid
        }")'>Send</button>
      </td>
    `;
        fragment.appendChild(row);
      });

      tbody.appendChild(fragment);
      // Function to toggle theme
    }

    function editUserById(uuid) {
      const user = userMap.get(uuid);

      if (!user) return;

      const formFields = {
        firstName: document.getElementById("editFirstName"),
        lastName: document.getElementById("editLastName"),
        email: document.getElementById("editEmail"),
        wss: document.getElementById("editWss"),
        userType: document.getElementById("editUserType"),
        extensionSelect: document.getElementById("extensionSelect"),
        isActiveCheckbox: document.getElementById("isActiveCheckbox"),
        companySelect: document.getElementById("editcompanySelect"),
        idList: document.getElementById("idList"),
        saveBtn: document.getElementById("saveBtn"),
        pwdbtn: document.getElementById("changePasswordBtn"),
        passwordBtn: document.getElementById("submitPasswordBtn"),
        passwordInput: document.getElementById("editPasswordInput"),
        didSelect: document.getElementById("didSelect"), // Container for DIDs
      };

      const companyName = user.company?.companyName;
      let selectedCompanyID = user.company?.id;
      let isActiveValue = user.is_active;
      let selectedIds = [];
      let extensionData = [];
      let selectedDIDs = []; // Array to store selected DIDs

      // Set the initial state
      formFields.isActiveCheckbox.checked = isActiveValue;
      formFields.isActiveCheckbox.onchange = () =>
        (isActiveValue = formFields.isActiveCheckbox.checked);

      formFields.firstName.value = user.firstName || "";
      formFields.lastName.value = user.lastName || "";
      formFields.email.value = user.email || "";
      formFields.userType.value = user.userType || "";
      formFields.wss.value = user.timeZone || "";
      // formFields.communication.value = user.communication || "";

      const currentExt = user.city; // value134 for extension
      const currentDIDs = user.reponse || []; // Assuming response contains the selected DIDs
      const tenant = user.company.code;
      //console.log("tenant", tenant);
      // Fetch and populate the company select dropdown

      const modal = new bootstrap.Modal(
        document.getElementById("editUserModal")
      );
      modal.show();

      const isDarkMode = document.body.classList.contains("dark-mode");
      const modalContent = document.querySelector(
        "#editUserModal .modal-content"
      );
      modalContent.style.backgroundColor = isDarkMode ? "#121212" : "#fff";
      modalContent.style.color = isDarkMode ? "#fff" : "#000";
      // Fetch extensions
      const apiKey = fullData.apikey; // Replace with real key
      const extUrl = `https://sip5.houstonsupport.com/pbx/proxyapi.php?reqtype=INFO&tenant=${tenant}&format=json&key=${apiKey}&info=extensions`;

      fetch(extUrl)
        .then((response) => response.json())
        .then((data) => {
          extensionData = data.map((item) => ({
            value134: item[134], // Extract value134
            value135: item[135], // Extract value135
          }));

          const value132Set = [
            ...new Set(extensionData.map((item) => item.value134)),
          ];

          formFields.extensionSelect.innerHTML =
            '<option value="">-- Select Extension --</option>';
          //console.log("count");
          //console.log(value132Set);
          //console.log("Total extensions available:", value132Set.length);
          value132Set.forEach((val, i) => {
            const option = document.createElement("option");
            option.value = i;
            option.textContent = val || `Item ${i}`;

            // Pre-select the current extension if it matches `currentExt`
            if (val === currentExt) {
              option.selected = true;
            }

            formFields.extensionSelect.appendChild(option);
          });

          formFields.extensionSelect.dispatchEvent(new Event("change"));
        })
        .catch((error) => {
          console.error("Error fetching extensions:", error);
        });

      // Handle the extension change
      formFields.extensionSelect.onchange = function () {
        const selectedIndex = this.value;

        if (extensionData[selectedIndex]) {
          selectedValues = {
            value134: extensionData[selectedIndex].value134,
            value135: extensionData[selectedIndex].value135,
          };
        } else {
          selectedValues = {};
        }
        //console.log("Selected Extension:", selectedValues);
      };

      // Fetch DIDs and create checkboxes
      const didUrl = `https://sip5.houstonsupport.com/pbx/proxyapi.php?key=${apiKey}&reqtype=INFO&tenant=${tenant}&format=json&info=dids`;

      fetch(didUrl)
        .then((response) => response.json())
        .then((data) => {
          // Process DIDs
          const currentDIDs = user.response || [];
          // let selectedDIDs = [];

          const didData = data
            .filter((item) => item[13]?.toLowerCase() !== "yes") // This line excludes items with "yes" in item[13]
            .map((item) => {
              const fullNumber = [item[2], item[3], item[4]].join(""); // Concatenate number parts
              const label = item[5] ? `${item[5]} - ${fullNumber}` : fullNumber; // Label text
              return { fullNumber, label };
            });
          //console.log("dids", data);

          // Clear existing checkboxes
          formFields.didSelect.innerHTML = "";
          selectedDIDs = [];
          // Create checkboxes
          didData.forEach((didItem) => {
            const checkboxLabel = document.createElement("label");
            checkboxLabel.classList.add("form-check-label");
            checkboxLabel.textContent = didItem.label;

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.classList.add("me-2");
            checkbox.value = didItem.label;
            checkbox.name = "didCheckbox";
            //console.log("didItem.label", didItem.label);
            // âœ… Pre-select if value exists in currentDIDs
            if (currentDIDs.includes(didItem.label)) {
              //console.log("true");
              checkbox.checked = true;
              selectedDIDs.push(didItem.label); // Add to array
            }

            // ðŸ”„ Update selectedDIDs on change
            checkbox.onchange = function () {
              if (this.checked) {
                if (!selectedDIDs.includes(this.value)) {
                  selectedDIDs.push(this.value);
                }
              } else {
                selectedDIDs = selectedDIDs.filter((did) => did !== this.value);
              }
              //console.log("Selected DIDs:", selectedDIDs);
            };

            const div = document.createElement("div");
            div.classList.add("form-check");
            div.appendChild(checkbox);
            div.appendChild(checkboxLabel);
            formFields.didSelect.appendChild(div);
          });
        })
        .catch((error) => {
          console.error("Error fetching DIDs:", error);
        });

      // Handle save button click
      formFields.saveBtn.onclick = () => {
        const updatedUser = {
          userid: user.uuid,
          firstName: formFields.firstName.value,
          lastName: formFields.lastName.value,
          userType: formFields.userType.value,
          // communication: formFields.communication.value,
          email: formFields.email.value,
          timeZone: formFields.wss.value,
          city: selectedValues.value134 || "", // Set city with value134 (extension value)
          state: selectedValues.value135 || "", // Set state with value135 (extension value)
          response: JSON.stringify(selectedDIDs), // Store selected DIDs in response array
          company: selectedCompanyID,
          is_active: isActiveValue,
        };
        //console.log(updatedUser);
        fetch(`${apiUrl}/user/editTokenUpdate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedUser),
        })
          .then((res) => res.json())
          .then(() => {
            fetchUsers(user.company?.code);
            modal.hide();
            formFields.firstName.value = "";
            formFields.lastName.value = "";
            formFields.wss.value = "";
            // formFields.communication.value = "";
            formFields.email.value = "";
            formFields.userType.value = "";
            formFields.extensionSelect.value = "";
            formFields.didSelect.innerHTML = ""; // If it's a container for DIDs

            // Reset any global values used
            selectedValues.value134 = "";
            selectedValues.value135 = "";
            selectedDIDs = [];
          });
      };
      formFields.pwdbtn.onclick = () => {
        const passwordEditControls = document.getElementById(
          "passwordEditControls"
        );
        const togglePasswordBtn = document.getElementById("togglePassword");
        const editPasswordInput = document.getElementById("editPasswordInput");
        const eyeIcon = document.getElementById("eyeIcon");
        const cancelPasswordBtn = document.getElementById("cancelPasswordBtn");
        // const submitPasswordBtn = document.getElementById("submitPasswordBtn");

        // Show the password input section
        changePasswordBtn.addEventListener("click", () => {
          passwordEditControls.style.display = "block";
        });

        // Toggle password visibility
        togglePasswordBtn.addEventListener("click", () => {
          const type =
            editPasswordInput.type === "password" ? "text" : "password";
          editPasswordInput.type = type;

          // Change eye icon
          eyeIcon.classList.toggle("fa-eye");
          eyeIcon.classList.toggle("fa-eye-slash");
        });

        // Cancel button hides the input section and clears input
        cancelPasswordBtn.addEventListener("click", () => {
          passwordEditControls.style.display = "none";
          editPasswordInput.value = "";
          editPasswordInput.type = "password";
          eyeIcon.classList.add("fa-eye");
          eyeIcon.classList.remove("fa-eye-slash");
        });
        // Handle password reset button click
        formFields.passwordBtn.onclick = () => {
          fetch(`${apiUrl}/user/resetUserApp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              password: formFields.passwordInput.value,
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                //console.log("succeess aoss");
              } else {
                Alert(data.error || "Try again.");
              }
            });
        };
      };
    }

    // Attach event listener to all "Send" buttons using event delegation
    document.addEventListener("click", function (e) {
      if (e.target && e.target.matches("button[data-user-uuid]")) {
        const uuid = e.target.getAttribute("data-user-uuid");
        sendUserById(uuid);
      }
    });

    function sendUserById(uuid) {
      const user = userMap.get(uuid);
      if (!user) return;
      var userId = user.id;
      fetch(`${apiUrl}/user/userNotify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userid: userId,
          // Pass the user ID as part of the request body
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          //console.log("Notification response:", data);
          alert("Notification sent successfully!");
        })
        .catch((error) => {
          console.error("Error sending notification:", error);
          alert("Failed to send notification");
        });
    }
    window.sendUserById = sendUserById;

    document.getElementById("openAddUserModal").onclick = function () {
      const modal = new bootstrap.Modal(
        document.getElementById("addUserModal")
      );
      const isDarkMode = document.body.classList.contains("dark-mode");
      // Style the modal according to theme
      const modalContent = document.querySelector(
        "#addUserModal .modal-content"
      );
      modalContent.style.backgroundColor = isDarkMode ? "#121212" : "#fff";
      modalContent.style.color = isDarkMode ? "#ffffff" : "#000000";

      modal.show();

      // Get values from form
      const formFields = {
        firstName: document.getElementById("firstName"),
        lastName: document.getElementById("lastName"),
        email: document.getElementById("addEmail"),
        wss: document.getElementById("wssServer"),
        userType: document.getElementById("userType"),
        extensionSelect: document.getElementById("addextensionSelect"),
        didSelect: document.getElementById("adddidSelect"),
        saveBtn: document.getElementById("addUserBtn"),
      };

      // Get the company ID from local storage
      const companyId = fullData.data.company.id;
      //console.log("companyId", companyId);
      const tenantName = localStorage.getItem("companyCode");
      //console.log("storedId", tenantName);
      const apiKey = fullData.apikey; // Replace with real key
      const extUrl = `https://sip5.houstonsupport.com/pbx/proxyapi.php?reqtype=INFO&tenant=${tenantName}&format=json&key=${apiKey}&info=extensions`;
      //console.log(extUrl);
      let extensionData = [];
      let selectedValues = {
        value134: "",
        value135: "",
      };

      fetch(extUrl)
        .then((response) => response.json())
        .then((data) => {
          // Map extension data to array of objects with value134 and value135
          extensionData = data.map((item) => ({
            value134: item[134], // Extension number
            value135: item[135], // Extra info (state)
          }));

          // Create a set of unique value132s for dropdown
          const value132Set = [
            ...new Set(extensionData.map((item) => item.value134)),
          ];

          // Clear and populate the dropdown
          formFields.extensionSelect.innerHTML =
            '<option value="">-- Select Extension --</option>';

          value132Set.forEach((val, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = val || `Item ${index}`;
            formFields.extensionSelect.appendChild(option);
          });

          // Add event listener for dropdown change
          formFields.extensionSelect.onchange = () => {
            const selectedIndex = parseInt(formFields.extensionSelect.value);

            // Reset values first
            selectedValues = {
              value134: "",
              value135: "",
            };

            // Assign values if a valid index is selected
            if (!isNaN(selectedIndex) && extensionData[selectedIndex]) {
              selectedValues.value134 = extensionData[selectedIndex].value134;
              selectedValues.value135 = extensionData[selectedIndex].value135;
            }

            //console.log("Selected Extension Data:", selectedValues);
          };

          // Trigger change to initialize with first selection if needed
          formFields.extensionSelect.dispatchEvent(new Event("change"));
        })
        .catch((error) => {
          console.error("Error fetching extensions:", error);
        });

      // Fetch DIDs and create checkboxes
      const didUrl = `https://sip5.houstonsupport.com/pbx/proxyapi.php?key=${apiKey}&reqtype=INFO&tenant=${tenantName}&format=json&info=dids`;

      let addselectedDIDs = []; // Global or scoped based on your needs

      fetch(didUrl)
        .then((res) => res.json())
        .then((data) => {
          // Clear existing checkboxes
          formFields.didSelect.innerHTML = "";

          data.forEach((item) => {
            // Skip DIDs marked as "yes" in item[13]
            if (item[13]?.toLowerCase() === "yes") return;

            const fullNumber = [item[2], item[3], item[4]].join(""); // Full number
            const label = item[5] ? `${item[5]} - ${fullNumber}` : fullNumber; // Label text

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = label;
            checkbox.classList.add("me-2");
            checkbox.name = "didCheckbox";

            const checkboxLabel = document.createElement("label");
            checkboxLabel.classList.add("form-check-label");
            checkboxLabel.textContent = label;

            // âœ… Update addselectedDIDs on checkbox change
            checkbox.onchange = function () {
              if (this.checked) {
                if (!addselectedDIDs.includes(this.value)) {
                  addselectedDIDs.push(this.value);
                }
              } else {
                addselectedDIDs = addselectedDIDs.filter(
                  (val) => val !== this.value
                );
              }
              //console.log("Selected DIDs:", addselectedDIDs);
            };

            const div = document.createElement("div");
            div.classList.add("form-check");
            div.appendChild(checkbox);
            div.appendChild(checkboxLabel);
            formFields.didSelect.appendChild(div);
          });
        })
        .catch((error) => {
          console.error("Error fetching DIDs:", error);
        });

      // Save button click handler
      formFields.saveBtn.onclick = () => {
        var selectedDIDs = [];
        const selectedExtension = formFields.extensionSelect.value;

        // Get selected DIDs
        const checkboxes = document.querySelectorAll(
          'input[name="didCheckbox"]:checked'
        );
        checkboxes.forEach((checkbox) => selectedDIDs.push(checkbox.value));
        var companyId = localStorage.getItem("companyId");
        const payload = {
          firstName: formFields.firstName.value,
          lastName: formFields.lastName.value,
          email: formFields.email.value,
          password: "9qM`nk+ACbd!{2+B",
          company: companyId,
          city: selectedValues.value134 || "",
          state: selectedValues.value135 || "",
          response: JSON.stringify(addselectedDIDs),
          userType: formFields.userType.value,
          timeZone: formFields.wss.value,
        };
        //console.log("payload", payload);
        fetch(`${apiUrl}/user/userregister`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then((res) => res.json())
          .then((data) => {
            //console.log("Add user response:", data);

            if (data.success) {
              //console.log("starting");
              const selectedCompanyCode = localStorage.getItem(
                "selectedCompanyCode"
              );
              //console.log("selectedCompanyCode", selectedCompanyCode);
              //console.log("1");
              fetchUsers(selectedCompanyCode); // Refresh user table
              //console.log("2");
              modal.hide();
              //console.log("3");
              formFields.firstName.value = "";
              formFields.lastName.value = "";
              formFields.email.value = "";
              formFields.userType.value = "";
              formFields.extensionSelect.value = "";
              formFields.didSelect.innerHTML = ""; // If it's a container for DIDs

              // Reset any global values used
              selectedValues.value134 = "";
              selectedValues.value135 = "";
              addselectedDIDs = [];
              //console.log("ending");
            } else {
              alert(data.error || "Failed to add user.");
              formFields.firstName.value = "";
              formFields.lastName.value = "";
              formFields.email.value = "";
              formFields.userType.value = "";
              formFields.extensionSelect.value = "";
              formFields.didSelect.innerHTML = ""; // If it's a container for DIDs

              // Reset any global values used
              selectedValues.value134 = "";
              selectedValues.value135 = "";
              addselectedDIDs = [];
            }
          })
          .catch((err) => {
            console.error("Error adding user:", err);
            alert("Something went wrong while adding the user.");
            formFields.firstName.value = "";
            formFields.lastName.value = "";
            formFields.email.value = "";
            formFields.userType.value = "";
            formFields.extensionSelect.value = "";
            formFields.didSelect.innerHTML = ""; // If it's a container for DIDs

            // Reset any global values used
            selectedValues.value134 = "";
            selectedValues.value135 = "";
            addselectedDIDs = [];
          });
      };
    };
    // Select DOM elements
    const changePasswordBtn = document.getElementById("changePasswordBtn");
    const passwordEditControls = document.getElementById(
      "passwordEditControls"
    );
    const togglePasswordBtn = document.getElementById("togglePassword");
    const editPasswordInput = document.getElementById("editPasswordInput");
    const eyeIcon = document.getElementById("eyeIcon");
    const cancelPasswordBtn = document.getElementById("cancelPasswordBtn");
    const submitPasswordBtn = document.getElementById("submitPasswordBtn");
    document
      .getElementById("searchInput")
      .addEventListener("input", function () {
        const searchValue = this.value.toLowerCase();
        const rows = document.querySelectorAll("#userTable tbody tr");

        rows.forEach((row) => {
          const cells = row.getElementsByTagName("td");
          let rowText = "";

          // Loop through all cells in the row
          for (let cell of cells) {
            rowText += cell.textContent.toLowerCase() + " "; // Combine all text content
          }

          // If search value matches any part of the row text, show the row; otherwise, hide it
          if (rowText.includes(searchValue)) {
            row.style.display = "";
          } else {
            row.style.display = "none";
          }
        });
      });
  } else if (userType === "admin") {
    adminDiv.classList.remove("hidden");
    superadminDiv.classList.add("hidden");
    document.getElementById("loginModal").style.display = "none";
    document.getElementById("admin").style.display = "contents";

    // Example: Append HTML to the #admin div
    const newDiv = document.createElement("div");
    newDiv.style.display = "contents";
    newDiv.innerHTML = ` <!-- Sidebar -->
          <aside id="sidebar" class="w-64 asideside hidden md:block transition-all duration-300 bg-gray-900 text-white">
    <!-- Logo & Toggle Button -->
    <div class="p-6 text-xl text-white flex items-center justify-center relative">
        <img src="logophoneihs.png" alt="Logo" class="h-10">
    </div>

    <!-- Nav Links -->
    <nav class="mt-2">
        <a href="#" onclick="showSection('dashboard')" class="block px-7 py-3 no-underline flex items-center space-x-2">
            <i class="fas fa-tachometer-alt mr-2"></i>
            <span class="sidebar-text">Dashboard</span>
        </a>
        <a href="#" onclick="showSection('users')" class="block px-7 py-3 no-underline flex items-center space-x-2">
            <i class="fas fa-users mr-2"></i>
            <span class="sidebar-text">Users</span>
        </a>
    </nav>
</aside>
<!-- Main content area -->
<div class="d-flex flex-column flex-grow-1">
    <!-- Topbar -->
    <header class="d-flex justify-content-between align-items-center p-3 border-bottom">
        <!-- Left: Toggle Button -->
        <div class="d-flex align-items-center">
            <button onclick="toggleSidebar()" class="btn btn-link text-dark fs-4 me-3">
                <i class="fas fa-bars"></i>
            </button>
        </div>

        <!-- Center: Company Select -->
        <div class="flex-grow-1 d-flex justify-content-center">

        </div>

        <!-- Right: Theme + Sign Out -->
        <div class="d-flex align-items-center gap-3">
            <div id="themeToggle" class="cursor-pointer fs-4" style="color: #0b3f65;">
                <i id="themeIcon" class="fa-regular fa-sun whitebg" onclick="toggleTheme()"></i>
            </div>
            <button onclick="localStorage.clear(); location.reload();" class="btn btn-link p-0 text-dark fs-4">
                <i class="fa fa-sign-out"></i>
            </button>
        </div>
    </header>


    <!-- Topbar -->
    <!-- Main Content with all static HTML -->
    <main id="mainContent" class="p-3 flex-1 space-y-10 main">
        <!-- Dashboard Section -->
        <section id="dashboard" class="section">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-white dark:bg-gray-800 p-3 shadow rounded-xl">
                    <h4 class="text-gray-600 dark:text-gray-300">Users</h4>
                    <p id="user-count" onclick="showSection('users')" class="text-2xl font-bold text-indigo-600" style="
    cursor: pointer;
">Loading...</p>

                </div>
                <div class="bg-white dark:bg-gray-800 p-3 shadow rounded-xl">
                    <h4 class="text-gray-600 dark:text-gray-300">Extension</h4>
                    <p id="extension-count" class="text-2xl font-bold text-green-600" style="
    cursor: pointer;
">Loading...</p>
                </div>
                <div class="bg-white dark:bg-gray-800 p-3 shadow rounded-xl">
                    <h4 class="text-gray-600 dark:text-gray-300">DIDs</h4>
                    <p id="did-count" class="text-2xl font-bold text-blue-600" style="
    cursor: pointer;
">Loaing...</p>
                </div>
            </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div class="grid grid-cols-1 mt-4">
                <div class="bg-white dark:bg-gray-800 p-3 shadow rounded-xl">
                    <div class="container" style="max-width:100%;">
                        <h2 class="mb-4">Call Data</h2>

                        <!-- Date Pickers -->
                        <div class="row g-3 mb-4">
                            <div class="col-md-3">
                                <label for="startDate" class="form-label">Start Date</label>
                                <input type="date" class="form-control" id="startDate">
                            </div>
                            <div class="col-md-3">
                                <label for="endDate" class="form-label">End Date</label>
                                <input type="date" class="form-control" id="endDate">
                            </div>
                            <div class="col-md-3 d-flex align-items-end">
                                <button class="btn btn-primary w-100" id="fetchCDR">Load Data</button>
                            </div>
                            <div class="col-md-3 d-flex align-items-end">
                                <button class="btn btn-primary mb-3" id="handleDownload">Download Report</button>
                            </div>
                        </div>

                        <!-- Outbound Section -->
                        <div class="row">
                            <div class="col-12">
                                <h4>All Calls</h4>
                                <div class="d-flex flex-wrap gap-3 mb-3">
                                    <!-- Filters -->
                                    <div>
                                        <label class="form-label mb-1">Status</label>
                                        <select id="dispositionFilter" class="form-select">
                                            <option value="">All</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="form-label mb-1">Caller</label>
                                        <select id="srcFilter" class="form-select">
                                            <option value="">All</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="form-label mb-1">Call Type</label>
                                        <select id="directionFilter" class="form-select">
                                            <option value="">All</option>
                                            <option value="Outbound">Outbound</option>
                                            <option value="Inbound">Inbound</option>
                                        </select>
                                    </div>
                                </div>

                                <div id="callCount" class="mb-3" style="font-weight: bold;"></div> <!-- <- New Line -->

                                <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                                    <table class="table table-bordered" id="combinedTable">
                                        <thead class="table-light">
                                            <tr>
                                                <th>Caller ID</th>
                                                <th>Caller</th>
                                                <th>Receiver</th>
                                                <th>Date & Time</th>
                                                <th>Status</th>
                                                <th>Call Type</th>
                                            </tr>
                                        </thead>
                                        <tbody></tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Users Section -->
        <section id="users" class="section hidden">
            <div class="flex justify-between items-center mb-2">
                <!-- Search Bar -->
                <input type="text" id="searchInput" class="form-control w-64" style="width: 89% !important;"
                    placeholder="Search...">
                <!-- Add User Button -->
                <button id="openAddUserModal"
                    class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600">
                    Add User
                </button>
            </div>

            <div class="table-responsive">
                <table class="table table-bordered" id="userTable">
                    <thead class="table-light">
                        <tr>
                            <th class="text-center px-4 py-2 fcolor">First Name</th>
                            <th class="text-center px-4 py-2 fcolor">Last Name</th>
                            <th class="text-center px-4 py-2 fcolor">Email</th>
                            <th class="text-center px-4 py-2 fcolor">User Type</th>
                            <th class="text-center px-4 py-2 fcolor">Is Active</th>
                            <th class="text-center px-4 py-2 fcolor">Extension Name</th>
                            <th class="text-center px-4 py-2 fcolor">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="tableBody">
                        <!-- Table rows from API response will be inserted here -->
                    </tbody>
                </table>
            </div>
        </section>


    </main>

    <!-- Add User Modal -->
    <div class="modal fade dark-mode" id="addUserModal" tabindex="-1" aria-labelledby="addUserModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="addUserModalLabel">Add User</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="firstName" class="form-label mb-0">First Name</label>
                                <input type="text" class="form-control" id="firstName" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="lastName" class="form-label mb-0">Last Name</label>
                                <input type="text" class="form-control" id="lastName" required>
                            </div>
                            <div class="col-md-12 mb-3">
                                <label for="userType" class="form-label mb-0">User Type</label>
                                <select class="form-select" id="userType" required>
                                    <option value="admin">Admin</option>
                                    <option value="user">User</option>
                                </select>
                            </div>
                            <div class="col-md-12 mb-3">
                                <label for="email" class="form-label mb-0">Email</label>
                                <input type="email" class="form-control" id="addEmail" required>
                            </div>
                            <div class="col-md-12 mb-3">
                                <label for="wssServer" class="form-label mb-0">SIP DOMAIN</label>
                                <<select class="form-select" id="wssServer" required>
                                    <option value="sip2.houstonsupport.com">SIP 2</option>
                                    <option value="sip5.houstonsupport.com">SIP 5</option>
                                    </select>
                            </div>

                            <!-- Extension Dropdown -->
                            <div class="col-md-6 mb-3">
                                <label for="addextensionSelect" class="form-label">Select Extension</label>
                                <select id="addextensionSelect" class="form-select" required>
                                    <option value="">-- Select Extension --</option>
                                </select>
                            </div>
                            <!-- DID Selection (Checkbox List) -->
                            <div class="col-md-6 mb-3">
                                <label for="adddidSelect" class="form-label mb-0">Select DIDs</label>
                                <div id="adddidSelect" style="height: 178px;overflow: scroll; overflow-x: hidden;">
                                </div>
                                <!-- Container for DIDs checkboxes -->
                            </div>

                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" id="addUserBtn">Save User</button>
                </div>
            </div>
        </div>
    </div>
    <!-- Edit User Modal -->
    <div class="modal fade dark-mode" id="editUserModal" tabindex="-1" aria-labelledby="editUserModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <!-- Increased modal width -->
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="editUserModalLabel">Edit User</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="editFirstName" class="form-label">First Name</label>
                                <input type="text" class="form-control" id="editFirstName" required />
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="editLastName" class="form-label">Last Name</label>
                                <input type="text" class="form-control" id="editLastName" required />
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="isActiveCheckbox">Is Active</label>
                                <input type="checkbox" id="isActiveCheckbox">
                            </div>
                            <div class="col-md-12 mb-3">
                                <label for="editUserType" class="form-label">User Type</label>
                                <select class="form-select" id="editUserType" required>
                                    <option value="admin">Admin</option>
                                    <option value="user">User</option>
                                </select>
                            </div>
                            <div class="col-md-12 mb-3">
                                <label for="editEmail" class="form-label">Email</label>
                                <input type="email" class="form-control" id="editEmail" required />
                            </div>

                            <div class="col-md-12 mb-3" id="passwordSection">
                                <label class="form-label">Password</label><br>
                                <button type="button" class="btn btn-outline-primary" id="changePasswordBtn">
                                    Change Password
                                </button>
                                <div id="passwordEditControls" style="display: none; margin-top: 10px;">
                                    <div class="input-group mb-2">
                                        <input type="password" class="form-control" id="editPasswordInput"
                                            placeholder="Enter new password" />
                                        <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                                            <i class="fa-solid fa-eye" id="eyeIcon"></i>
                                        </button>
                                    </div>
                                    <div class="d-flex gap-2">
                                        <button type="submit" class="btn btn-success"
                                            id="submitPasswordBtn">Submit</button>
                                        <button type="button" class="btn btn-secondary"
                                            id="cancelPasswordBtn">Cancel</button>
                                    </div>
                                </div>
                            </div>

                           <div class="col-md-12 mb-3">
                                <label for="wssServer" class="form-label mb-0">SIP DOMAIN</label>
                                <<select class="form-select" id="wssServer" required>
                                    <option value="sip2.houstonsupport.com">SIP 2</option>
                                    <option value="sip5.houstonsupport.com">SIP 5</option>
                                    </select>
                            </div>

                            <div class="col-md-6 mb-3">
                                <label for="extensionSelect" class="form-label">Select Extension</label>
                                <select id="extensionSelect" class="form-select">
                                    <option value="">-- Select Extension --</option>
                                </select>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="didSelect" class="form-label">Select DIDs</label>
                                <div id="didSelect" style="height: 178px;overflow: scroll; overflow-x: hidden;">
                                    <!-- Checkbox items will be appended here -->
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        Close
                    </button>
                    <button type="button" class="btn btn-primary" id="saveBtn">Save Changes</button>
                </div>
            </div>
        </div>
    </div>

</div>`;
    adminDiv.appendChild(newDiv);
    //const apiUrl = "http://172.31.199.45:5000";
    const apiUrl = "https://voiceapi.shuklais.com";

    let userMap = new Map();
    const fullData = JSON.parse(localStorage.getItem("fullData"));
    //console.log(fullData);
    fetchUsers();
    function fetchUsers() {
      var selectedCompanyCode = fullData.data.company.code;
      //console.log("Fetching extensions for:", selectedCompanyCode);
      fetch(`${apiUrl}/user/listUser/${selectedCompanyCode}`)
        .then((res) => res.json())
        .then((data) => {
          const users = data.success || [];
          userMap.clear();

          const userCountElement = document.getElementById("user-count");
          if (userCountElement) {
            userCountElement.textContent = users.length.toLocaleString();
          }

          users.forEach((user) => userMap.set(user.uuid, user));
          renderUsers(users);
          fetchExt(selectedCompanyCode);
          // fetchCDR(selectedCompanyCode)
          fetchDid(selectedCompanyCode);
        })
        .catch((error) => console.error("Error fetching users:", error));
    }
    function fetchExt(selectedCompanyCode) {
      const tenant = selectedCompanyCode;
      const apiKey = fullData.apikey;
      const extUrl = `https://sip5.houstonsupport.com/pbx/proxyapi.php?reqtype=INFO&tenant=${tenant}&format=json&key=${apiKey}&info=extensions`;

      fetch(extUrl)
        .then((response) => response.json())
        .then((data) => {
          extensionData = data.map((item) => ({
            value134: item[134],
          }));

          const value132Set = [
            ...new Set(extensionData.map((item) => item.value134)),
          ];
          const extensionCount = value132Set.length;

          const extCountElement = document.getElementById("extension-count");
          if (extCountElement) {
            extCountElement.textContent = extensionCount.toLocaleString();
          }
        })
        .catch((error) => console.error("Error fetching extensions:", error));
    }
    function fetchDid(selectedCompanyCode) {
      const tenant = selectedCompanyCode;
      const apiKey = fullData.apikey; // Replace with real key
      const didUrl = `https://sip5.houstonsupport.com/pbx/proxyapi.php?key=${apiKey}&reqtype=INFO&tenant=${tenant}&format=json&info=dids`;

      fetch(didUrl)
        .then((response) => response.json())
        .then((data) => {
          const didCount = data.length || 0;
          //console.log("DIDs:", data);
          //console.log("Total DIDs:", didCount);

          // ✅ Use getElementById instead of querySelector
          const didCountElement = document.getElementById("did-count");
          if (didCountElement) {
            didCountElement.textContent = didCount.toLocaleString();
          }
        })
        .catch((error) => {
          console.error("Error fetching DIDs:", error);
        });
    }
    document.getElementById("fetchCDR").onclick = function () {
      var apiKey = fullData.apikey;
      var tenant = fullData.data.company.code;
      //console.log(tenant);
      const startDate = document.getElementById("startDate").value;
      const endDate = document.getElementById("endDate").value;

      if (!startDate || !endDate) {
        alert("Please select both dates.");
        return;
      }

      const start = `${startDate} 00:00`;
      const end = `${endDate} 23:59`;
      const url = `https://sip5.houstonsupport.com/pbx/proxyapi.php?reqtype=INFO&info=cdrs&tenant=${tenant}&key=${apiKey}&format=json&start=${encodeURIComponent(
        start
      )}&end=${encodeURIComponent(end)}`;
      //console.log("url", url);
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          const parsed = data
            .map((row) => {
              // Use row.wherelanded if row.realsrc is blank
              let realsrc = row.realsrc || row.wherelanded;

              // Remove everything after '-' for filtering
              const filteredSrc = realsrc
                ? realsrc.split("-")[0].trim()
                : realsrc;

              return {
                clid: row.clid,
                realsrc: filteredSrc, // Use filtered value for filtering and display
                firstdst: row.firstdst,
                start: row.start,
                disposition: row.disposition,
                userfield: row.userfield,
                direction:
                  row.userfield === "[outbound]" ? "Outbound" : "Inbound",
              };
            })
            // Filter out rows with N/A or numbers greater than 6 digits
            .filter(
              (row) =>
                row.realsrc &&
                row.realsrc.toLowerCase() !== "n/a" &&
                (!/^\d+$/.test(row.realsrc) || row.realsrc.length <= 6)
            );

          currentData = parsed;
          renderTable(parsed);
        })
        .catch((error) => {
          console.error("Error fetching CDR data:", error);
        });
    };

    function renderTable(data) {
      populateFilters(data);

      function applyFilters() {
        const disposition = document.getElementById("dispositionFilter").value;
        const src = document.getElementById("srcFilter").value;
        const direction = document.getElementById("directionFilter").value;

        const filtered = data.filter(
          (row) =>
            (!disposition || row.disposition === disposition) &&
            (!src || row.realsrc === src) &&
            (!direction || row.direction === direction)
        );

        const tableBody = document
          .getElementById("combinedTable")
          .querySelector("tbody");
        tableBody.innerHTML = "";
        filtered.forEach((row) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
              <td>${row.clid}</td>
              <td>${row.realsrc}</td>
              <td>${row.firstdst}</td>
              <td>${row.start}</td>
              <td>${row.disposition}</td>
              <td>${row.direction}</td>
            `;
          tableBody.appendChild(tr);
        });

        // Update individual disposition counts
        const callCountDiv = document.getElementById("callCount");
        const dispositionsMap = {};

        filtered.forEach((row) => {
          if (!dispositionsMap[row.disposition]) {
            dispositionsMap[row.disposition] = {
              total: 0,
              inbound: 0,
              outbound: 0,
            };
          }
          dispositionsMap[row.disposition].total++;
          if (row.direction === "Inbound") {
            dispositionsMap[row.disposition].inbound++;
          } else if (row.direction === "Outbound") {
            dispositionsMap[row.disposition].outbound++;
          }
        });

        let html = "<ul style='padding-left: 20px;'>";
        for (const [disp, counts] of Object.entries(dispositionsMap)) {
          html += `
              <li title="Inbound: ${counts.inbound} calls, Outbound: ${counts.outbound} calls">
                ${disp}: ${counts.total} calls
              </li>
            `;
        }
        html += "</ul>";

        const inAnsElement = document.getElementById("in_ans");
        const answeredCallsCount = filtered.filter(
          (row) => row.disposition === "ANSWERED" && row.direction === "Inbound"
        ).length;
        inAnsElement.textContent = answeredCallsCount;
      }

      // Bind filters
      ["dispositionFilter", "srcFilter", "directionFilter"].forEach((id) => {
        document.getElementById(id).onchange = applyFilters;
      });
      // renderSeparateDirectionCharts(filtered, startDate, endDate);

      // Initial render
      applyFilters();
    }

    function populateFilters(data) {
      const dispositions = [...new Set(data.map((row) => row.disposition))];
      const sources = [
        ...new Set(
          data
            .map((row) => row.realsrc)
            .filter(
              (src) =>
                src &&
                src.toLowerCase() !== "n/a" &&
                (!/^\d+$/.test(src) || src.length <= 6)
            )
        ),
      ];

      const dispositionSelect = document.getElementById("dispositionFilter");
      const srcSelect = document.getElementById("srcFilter");

      // Clear existing options except 'All'
      [dispositionSelect, srcSelect].forEach((select) => {
        while (select.options.length > 1) select.remove(1);
      });

      dispositions.forEach((val) =>
        dispositionSelect.add(new Option(val, val))
      );
      sources.forEach((val) => srcSelect.add(new Option(val, val)));
    }

    function generateReportData(data) {
      const report = {};

      data
        .filter(
          (row) =>
            row.realsrc &&
            row.realsrc.toLowerCase() !== "n/a" &&
            (!/^\d+$/.test(row.realsrc) || row.realsrc.length <= 6)
        )
        .forEach((row) => {
          const source = row.realsrc || "Unknown";
          const direction = row.direction; // 'Inbound' or 'Outbound'
          const disposition = row.disposition || "Unknown";

          if (!report[source]) {
            report[source] = {
              inbound: {
                "no answer": 0,
                answered: 0,
                failed: 0,
                busy: 0,
                congestion: 0,
              },
              outbound: {
                "no answer": 0,
                answered: 0,
                failed: 0,
                busy: 0,
                congestion: 0,
              },
            };
          }

          if (direction === "Inbound" || direction === "Outbound") {
            const disp = disposition.toLowerCase(); // Make lowercase for matching
            if (report[source][direction.toLowerCase()][disp] !== undefined) {
              report[source][direction.toLowerCase()][disp]++;
            }
          }
        });

      return report;
    }
    async function downloadExcel(report) {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Call Report");

      // Add headers
      worksheet.mergeCells("B1:F1");
      worksheet.getCell("B1").value = "Inbound";
      worksheet.getCell("B1").alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      worksheet.mergeCells("G1:K1");
      worksheet.getCell("G1").value = "Outbound";
      worksheet.getCell("G1").alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      worksheet.addRow([
        "Caller",
        "No Answer",
        "Answered",
        "Failed",
        "Busy",
        "Congestion",
        "No Answer",
        "Answered",
        "Failed",
        "Busy",
        "Congestion",
      ]);

      // Add data rows
      for (const [source, counts] of Object.entries(report)) {
        worksheet.addRow([
          source,
          counts.inbound["no answer"],
          counts.inbound["answered"],
          counts.inbound["failed"],
          counts.inbound["busy"],
          counts.inbound["congestion"],
          counts.outbound["no answer"],
          counts.outbound["answered"],
          counts.outbound["failed"],
          counts.outbound["busy"],
          counts.outbound["congestion"],
        ]);
      }

      // Apply borders to all cells
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      // Export the workbook
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "Call_Report.xlsx";
      link.click();
    }

    // Attach the function to the button click event
    document.getElementById("handleDownload").onclick = function () {
      const report = generateReportData(currentData); // currentData = your filtered table data
      downloadExcel(report);
    };

    // Default today's date for both pickers
    window.onload = () => {
      const today = new Date().toISOString().split("T")[0];
      document.getElementById("startDate").value = today;
      document.getElementById("endDate").value = today;
    };

    // 🎯 Animation function
    function animateCountUp(element, endValue, duration = 1000) {
      const startValue = parseInt(element.textContent.replace(/,/g, "")) || 0;
      const startTime = performance.now();

      function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = Math.floor(
          progress * (endValue - startValue) + startValue
        );
        element.textContent = currentValue.toLocaleString();

        if (progress < 1) {
          requestAnimationFrame(update);
        }
      }

      requestAnimationFrame(update);
    }

    function renderUsers(users) {
      const tbody = document.querySelector("#userTable tbody");
      const fragment = document.createDocumentFragment();
      tbody.innerHTML = "";

      users.forEach((user) => {
        const ext = user.extension?.[0] || {};
        const row = document.createElement("tr");
        row.className = "odd:bg-gray-50 dark:odd:bg-gray-700";
        row.style.cursor = "pointer";
        row.onclick = () => editUserById(user.uuid);
        //console.log("infoinrow", user);
        row.innerHTML = `
      <td class="text-center px-4 py-1">${user.firstName || ""}</td>
      <td class="text-center px-4 py-1">${user.lastName || ""}</td>
      <td class="text-center px-4 py-1">${user.email || ""}</td>
      <td class="text-center px-4 py-1">${user.userType || ""}</td>
      <td class="text-center px-4 py-1">${user.is_active ? "Yes" : "No"}</td>
      <td class="text-center px-4 py-1">${user.city || "-"}</td>
      <td class="text-center px-4 py-1 flex justify-center">
        <button class="btn btn-sm btn-success" onclick='event.stopPropagation(); sendUserById("${
          user.uuid
        }")'>Send</button>
      </td>
    `;
        fragment.appendChild(row);
      });

      tbody.appendChild(fragment);
      // Function to toggle theme
    }

    function editUserById(uuid) {
      const user = userMap.get(uuid);

      if (!user) return;

      const formFields = {
        firstName: document.getElementById("editFirstName"),
        lastName: document.getElementById("editLastName"),
        email: document.getElementById("editEmail"),
        wss: document.getElementById("editWss"),
        userType: document.getElementById("editUserType"),
        extensionSelect: document.getElementById("extensionSelect"),
        isActiveCheckbox: document.getElementById("isActiveCheckbox"),
        companySelect: document.getElementById("editcompanySelect"),
        idList: document.getElementById("idList"),
        saveBtn: document.getElementById("saveBtn"),
        pwdbtn: document.getElementById("changePasswordBtn"),
        passwordBtn: document.getElementById("submitPasswordBtn"),
        passwordInput: document.getElementById("editPasswordInput"),
        didSelect: document.getElementById("didSelect"), // Container for DIDs
      };

      const companyName = user.company?.companyName;
      let selectedCompanyID = user.company?.id;
      let isActiveValue = user.is_active;
      let selectedIds = [];
      let extensionData = [];
      let selectedDIDs = []; // Array to store selected DIDs

      // Set the initial state
      formFields.isActiveCheckbox.checked = isActiveValue;
      formFields.isActiveCheckbox.onchange = () =>
        (isActiveValue = formFields.isActiveCheckbox.checked);

      formFields.firstName.value = user.firstName || "";
      formFields.lastName.value = user.lastName || "";
      formFields.email.value = user.email || "";
      formFields.userType.value = user.userType || "";
      formFields.wss.value = user.timeZone || "";
      // formFields.communication.value = user.communication || "";

      const currentExt = user.city; // value134 for extension
      const currentDIDs = user.reponse || []; // Assuming response contains the selected DIDs
      const tenant = user.company.code;
      //console.log("tenant", tenant);
      // Fetch and populate the company select dropdown

      const modal = new bootstrap.Modal(
        document.getElementById("editUserModal")
      );
      modal.show();

      const isDarkMode = document.body.classList.contains("dark-mode");
      const modalContent = document.querySelector(
        "#editUserModal .modal-content"
      );
      modalContent.style.backgroundColor = isDarkMode ? "#121212" : "#fff";
      modalContent.style.color = isDarkMode ? "#fff" : "#000";
      // Fetch extensions
      const apiKey = fullData.apikey; // Replace with real key
      const extUrl = `https://sip5.houstonsupport.com/pbx/proxyapi.php?reqtype=INFO&tenant=${tenant}&format=json&key=${apiKey}&info=extensions`;

      fetch(extUrl)
        .then((response) => response.json())
        .then((data) => {
          extensionData = data.map((item) => ({
            value134: item[134], // Extract value134
            value135: item[135], // Extract value135
          }));

          const value132Set = [
            ...new Set(extensionData.map((item) => item.value134)),
          ];

          formFields.extensionSelect.innerHTML =
            '<option value="">-- Select Extension --</option>';
          //console.log("count");
          //console.log(value132Set);
          //console.log("Total extensions available:", value132Set.length);
          value132Set.forEach((val, i) => {
            const option = document.createElement("option");
            option.value = i;
            option.textContent = val || `Item ${i}`;

            // Pre-select the current extension if it matches `currentExt`
            if (val === currentExt) {
              option.selected = true;
            }

            formFields.extensionSelect.appendChild(option);
          });

          formFields.extensionSelect.dispatchEvent(new Event("change"));
        })
        .catch((error) => {
          console.error("Error fetching extensions:", error);
        });

      // Handle the extension change
      formFields.extensionSelect.onchange = function () {
        const selectedIndex = this.value;

        if (extensionData[selectedIndex]) {
          selectedValues = {
            value134: extensionData[selectedIndex].value134,
            value135: extensionData[selectedIndex].value135,
          };
        } else {
          selectedValues = {};
        }
        //console.log("Selected Extension:", selectedValues);
      };

      // Fetch DIDs and create checkboxes
      const didUrl = `https://sip5.houstonsupport.com/pbx/proxyapi.php?key=${apiKey}&reqtype=INFO&tenant=${tenant}&format=json&info=dids`;

      fetch(didUrl)
        .then((response) => response.json())
        .then((data) => {
          // Process DIDs
          const currentDIDs = user.response || [];
          // let selectedDIDs = [];

          const didData = data
            .filter((item) => item[13]?.toLowerCase() !== "yes") // This line excludes items with "yes" in item[13]
            .map((item) => {
              const fullNumber = [item[2], item[3], item[4]].join(""); // Concatenate number parts
              const label = item[5] ? `${item[5]} - ${fullNumber}` : fullNumber; // Label text
              return { fullNumber, label };
            });
          //console.log("dids", data);

          // Clear existing checkboxes
          formFields.didSelect.innerHTML = "";
          selectedDIDs = [];
          // Create checkboxes
          didData.forEach((didItem) => {
            const checkboxLabel = document.createElement("label");
            checkboxLabel.classList.add("form-check-label");
            checkboxLabel.textContent = didItem.label;

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.classList.add("me-2");
            checkbox.value = didItem.label;
            checkbox.name = "didCheckbox";
            //console.log("didItem.label", didItem.label);
            // âœ… Pre-select if value exists in currentDIDs
            if (currentDIDs.includes(didItem.label)) {
              //console.log("true");
              checkbox.checked = true;
              selectedDIDs.push(didItem.label); // Add to array
            }

            // ðŸ”„ Update selectedDIDs on change
            checkbox.onchange = function () {
              if (this.checked) {
                if (!selectedDIDs.includes(this.value)) {
                  selectedDIDs.push(this.value);
                }
              } else {
                selectedDIDs = selectedDIDs.filter((did) => did !== this.value);
              }
              //console.log("Selected DIDs:", selectedDIDs);
            };

            const div = document.createElement("div");
            div.classList.add("form-check");
            div.appendChild(checkbox);
            div.appendChild(checkboxLabel);
            formFields.didSelect.appendChild(div);
          });
        })
        .catch((error) => {
          console.error("Error fetching DIDs:", error);
        });

      // Handle save button click
      formFields.saveBtn.onclick = () => {
        const updatedUser = {
          userid: user.uuid,
          firstName: formFields.firstName.value,
          lastName: formFields.lastName.value,
          userType: formFields.userType.value,
          email: formFields.email.value,
          timeZone: formFields.wss.value,
          city: selectedValues.value134 || "", // Set city with value134 (extension value)
          state: selectedValues.value135 || "", // Set state with value135 (extension value)
          response: JSON.stringify(selectedDIDs), // Store selected DIDs in response array
          company: selectedCompanyID,
          is_active: isActiveValue,
        };
        //console.log(updatedUser);
        fetch(`${apiUrl}/user/editTokenUpdate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedUser),
        })
          .then((res) => res.json())
          .then(() => {
            fetchUsers(user.company?.code);
            modal.hide();
            formFields.firstName.value = "";
            formFields.lastName.value = "";
            formFields.wss.value = "";
            // formFields.communication.value = "";
            formFields.email.value = "";
            formFields.userType.value = "";
            formFields.extensionSelect.value = "";
            formFields.didSelect.innerHTML = ""; // If it's a container for DIDs

            // Reset any global values used
            selectedValues.value134 = "";
            selectedValues.value135 = "";
            selectedDIDs = [];
          });
      };
      formFields.pwdbtn.onclick = () => {
        const passwordEditControls = document.getElementById(
          "passwordEditControls"
        );
        const togglePasswordBtn = document.getElementById("togglePassword");
        const editPasswordInput = document.getElementById("editPasswordInput");
        const eyeIcon = document.getElementById("eyeIcon");
        const cancelPasswordBtn = document.getElementById("cancelPasswordBtn");
        // const submitPasswordBtn = document.getElementById("submitPasswordBtn");

        // Show the password input section
        changePasswordBtn.addEventListener("click", () => {
          passwordEditControls.style.display = "block";
        });

        // Toggle password visibility
        togglePasswordBtn.addEventListener("click", () => {
          const type =
            editPasswordInput.type === "password" ? "text" : "password";
          editPasswordInput.type = type;

          // Change eye icon
          eyeIcon.classList.toggle("fa-eye");
          eyeIcon.classList.toggle("fa-eye-slash");
        });

        // Cancel button hides the input section and clears input
        cancelPasswordBtn.addEventListener("click", () => {
          passwordEditControls.style.display = "none";
          editPasswordInput.value = "";
          editPasswordInput.type = "password";
          eyeIcon.classList.add("fa-eye");
          eyeIcon.classList.remove("fa-eye-slash");
        });
        // Handle password reset button click
        formFields.passwordBtn.onclick = () => {
          fetch(`${apiUrl}/user/resetUserApp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              password: formFields.passwordInput.value,
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                //console.log("succeess aoss");
              } else {
                Alert(data.error || "Try again.");
              }
            });
        };
      };
    }

    // Attach event listener to all "Send" buttons using event delegation
    document.addEventListener("click", function (e) {
      if (e.target && e.target.matches("button[data-user-uuid]")) {
        const uuid = e.target.getAttribute("data-user-uuid");
        sendUserById(uuid);
      }
    });

    function sendUserById(uuid) {
      const user = userMap.get(uuid);
      if (!user) return;
      var userId = user.id;
      fetch(`${apiUrl}/user/userNotify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userid: userId,
          // Pass the user ID as part of the request body
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          //console.log("Notification response:", data);
          alert("Notification sent successfully!");
        })
        .catch((error) => {
          console.error("Error sending notification:", error);
          alert("Failed to send notification");
        });
    }
    window.sendUserById = sendUserById;

    document.getElementById("openAddUserModal").onclick = function () {
      const modal = new bootstrap.Modal(
        document.getElementById("addUserModal")
      );
      const isDarkMode = document.body.classList.contains("dark-mode");
      // Style the modal according to theme
      const modalContent = document.querySelector(
        "#addUserModal .modal-content"
      );
      modalContent.style.backgroundColor = isDarkMode ? "#121212" : "#fff";
      modalContent.style.color = isDarkMode ? "#ffffff" : "#000000";

      modal.show();

      // Get values from form
      const formFields = {
        firstName: document.getElementById("firstName"),
        lastName: document.getElementById("lastName"),
        email: document.getElementById("addEmail"),
        wss: document.getElementById("wssServer"),
        userType: document.getElementById("userType"),
        extensionSelect: document.getElementById("addextensionSelect"),
        didSelect: document.getElementById("adddidSelect"),
        saveBtn: document.getElementById("addUserBtn"),
      };

      // Get the company ID from local storage
      const companyId = fullData.data.company.id;
      //console.log("companyId", companyId);
      const tenantName = localStorage.getItem("companyCode");
      //console.log("storedId", tenantName);
      const apiKey = fullData.apikey; // Replace with real key
      const extUrl = `https://sip5.houstonsupport.com/pbx/proxyapi.php?reqtype=INFO&tenant=${tenantName}&format=json&key=${apiKey}&info=extensions`;
      //console.log(extUrl);
      let extensionData = [];
      let selectedValues = {
        value134: "",
        value135: "",
      };

      fetch(extUrl)
        .then((response) => response.json())
        .then((data) => {
          // Map extension data to array of objects with value134 and value135
          extensionData = data.map((item) => ({
            value134: item[134], // Extension number
            value135: item[135], // Extra info (state)
          }));

          // Create a set of unique value132s for dropdown
          const value132Set = [
            ...new Set(extensionData.map((item) => item.value134)),
          ];

          // Clear and populate the dropdown
          formFields.extensionSelect.innerHTML =
            '<option value="">-- Select Extension --</option>';

          value132Set.forEach((val, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = val || `Item ${index}`;
            formFields.extensionSelect.appendChild(option);
          });

          // Add event listener for dropdown change
          formFields.extensionSelect.onchange = () => {
            const selectedIndex = parseInt(formFields.extensionSelect.value);

            // Reset values first
            selectedValues = {
              value134: "",
              value135: "",
            };

            // Assign values if a valid index is selected
            if (!isNaN(selectedIndex) && extensionData[selectedIndex]) {
              selectedValues.value134 = extensionData[selectedIndex].value134;
              selectedValues.value135 = extensionData[selectedIndex].value135;
            }

            //console.log("Selected Extension Data:", selectedValues);
          };

          // Trigger change to initialize with first selection if needed
          formFields.extensionSelect.dispatchEvent(new Event("change"));
        })
        .catch((error) => {
          console.error("Error fetching extensions:", error);
        });

      // Fetch DIDs and create checkboxes
      const didUrl = `https://sip5.houstonsupport.com/pbx/proxyapi.php?key=${apiKey}&reqtype=INFO&tenant=${tenantName}&format=json&info=dids`;

      let addselectedDIDs = []; // Global or scoped based on your needs

      fetch(didUrl)
        .then((res) => res.json())
        .then((data) => {
          // Clear existing checkboxes
          formFields.didSelect.innerHTML = "";

          data.forEach((item) => {
            // Skip DIDs marked as "yes" in item[13]
            if (item[13]?.toLowerCase() === "yes") return;

            const fullNumber = [item[2], item[3], item[4]].join(""); // Full number
            const label = item[5] ? `${item[5]} - ${fullNumber}` : fullNumber; // Label text

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = label;
            checkbox.classList.add("me-2");
            checkbox.name = "didCheckbox";

            const checkboxLabel = document.createElement("label");
            checkboxLabel.classList.add("form-check-label");
            checkboxLabel.textContent = label;

            // âœ… Update addselectedDIDs on checkbox change
            checkbox.onchange = function () {
              if (this.checked) {
                if (!addselectedDIDs.includes(this.value)) {
                  addselectedDIDs.push(this.value);
                }
              } else {
                addselectedDIDs = addselectedDIDs.filter(
                  (val) => val !== this.value
                );
              }
              //console.log("Selected DIDs:", addselectedDIDs);
            };

            const div = document.createElement("div");
            div.classList.add("form-check");
            div.appendChild(checkbox);
            div.appendChild(checkboxLabel);
            formFields.didSelect.appendChild(div);
          });
        })
        .catch((error) => {
          console.error("Error fetching DIDs:", error);
        });

      // Save button click handler
      formFields.saveBtn.onclick = () => {
        var selectedDIDs = [];
        const selectedExtension = formFields.extensionSelect.value;

        // Get selected DIDs
        const checkboxes = document.querySelectorAll(
          'input[name="didCheckbox"]:checked'
        );
        checkboxes.forEach((checkbox) => selectedDIDs.push(checkbox.value));
        var companyId = localStorage.getItem("companyId");
        const payload = {
          firstName: formFields.firstName.value,
          lastName: formFields.lastName.value,
          email: formFields.email.value,
          password: "9qM`nk+ACbd!{2+B",
          company: companyId,
          city: selectedValues.value134 || "",
          state: selectedValues.value135 || "",
          response: JSON.stringify(addselectedDIDs),
          userType: formFields.userType.value,
          timeZone: formFields.wss.value,
        };
        //console.log("payload", payload);
        fetch(`${apiUrl}/user/userregister`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then((res) => res.json())
          .then((data) => {
            //console.log("Add user response:", data);

            if (data.success) {
              //console.log("starting");
              const selectedCompanyCode = localStorage.getItem(
                "selectedCompanyCode"
              );
              //console.log("selectedCompanyCode", selectedCompanyCode);
              //console.log("1");
              fetchUsers(selectedCompanyCode); // Refresh user table
              //console.log("2");
              modal.hide();
              //console.log("3");
              formFields.firstName.value = "";
              formFields.lastName.value = "";
              formFields.email.value = "";
              formFields.userType.value = "";
              formFields.extensionSelect.value = "";
              formFields.didSelect.innerHTML = ""; // If it's a container for DIDs

              // Reset any global values used
              selectedValues.value134 = "";
              selectedValues.value135 = "";
              selectedDIDs = [];
              //console.log("ending");
            } else {
              alert(data.error || "Failed to add user.");
              formFields.firstName.value = "";
              formFields.lastName.value = "";
              formFields.email.value = "";
              formFields.userType.value = "";
              formFields.extensionSelect.value = "";
              formFields.didSelect.innerHTML = ""; // If it's a container for DIDs

              // Reset any global values used
              selectedValues.value134 = "";
              selectedValues.value135 = "";
              selectedDIDs = [];
            }
          })
          .catch((err) => {
            console.error("Error adding user:", err);
            alert("Something went wrong while adding the user.");
            formFields.firstName.value = "";
            formFields.lastName.value = "";
            formFields.email.value = "";
            formFields.userType.value = "";
            formFields.extensionSelect.value = "";
            formFields.didSelect.innerHTML = ""; // If it's a container for DIDs

            // Reset any global values used
            selectedValues.value134 = "";
            selectedValues.value135 = "";
            selectedDIDs = [];
          });
      };
    };
  }
  // Select DOM elements
  const changePasswordBtn = document.getElementById("changePasswordBtn");
  const passwordEditControls = document.getElementById("passwordEditControls");
  const togglePasswordBtn = document.getElementById("togglePassword");
  const editPasswordInput = document.getElementById("editPasswordInput");
  const eyeIcon = document.getElementById("eyeIcon");
  const cancelPasswordBtn = document.getElementById("cancelPasswordBtn");
  const submitPasswordBtn = document.getElementById("submitPasswordBtn");
  document.getElementById("searchInput").addEventListener("input", function () {
    const searchValue = this.value.toLowerCase();
    const rows = document.querySelectorAll("#userTable tbody tr");

    rows.forEach((row) => {
      const cells = row.getElementsByTagName("td");
      let rowText = "";

      // Loop through all cells in the row
      for (let cell of cells) {
        rowText += cell.textContent.toLowerCase() + " "; // Combine all text content
      }

      // If search value matches any part of the row text, show the row; otherwise, hide it
      if (rowText.includes(searchValue)) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "light";
  const themeLink = document.getElementById("themeStylesheet");
  const icon = document.getElementById("themeIcon");

  themeLink.setAttribute("href", savedTheme + ".css");
  // icon.classList.add(savedTheme === "dark" ? "fa-sun" : "fa-moon");

  // document.getElementById("themeToggle").addEventListener("click", toggleTheme);
});
