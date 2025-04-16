// Toggle submenu with arrow rotation
window.onload = function () {
  setActiveMenu("dashboard"); // Set default active menu
};
function setActiveMenu(menu) {
  const menuItems = document.querySelectorAll("#sidebar a");
  const profileDropdown = document.getElementById("profileDropdown");
  menuItems.forEach((item) => {
    item.classList.remove("active-menu"); // Remove active class from all items
    if (item.getAttribute("data-menu") === menu) {
      item.classList.add("active-menu"); // Add active class to the clicked item
    }
  });
  // Close the profile dropdown if it's open
  if (!profileDropdown.classList.contains("hidden")) {
    profileDropdown.classList.add("hidden");
  }
}
function toggleMenu(menuId, arrowId) {
  const menu = document.getElementById(menuId);
  const arrow = document.getElementById(arrowId);
  menu.classList.toggle("hidden");
  arrow.classList.toggle("rotate-180");
}

// Toggle profile dropdown
function toggleProfile() {
  const dropdown = document.getElementById("profileDropdown");
  dropdown.classList.toggle("hidden");

  // Remove existing listener if any
  document.removeEventListener("click", handleClickOutside);

  if (!dropdown.classList.contains("hidden")) {
    // Delay to allow the current click to finish
    setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);
  }

  function handleClickOutside(event) {
    const profileBtn = document.getElementById("profileButton"); // Assuming there's a button that triggers the dropdown
    if (
      !dropdown.contains(event.target) &&
      !profileBtn.contains(event.target)
    ) {
      dropdown.classList.add("hidden");
      document.removeEventListener("click", handleClickOutside);
    }
  }
}

// Open Add Extension Modal
function openAddExtensionModal() {
  const modal = new bootstrap.Modal(
    document.getElementById("addExtensionModal")
  );
  modal.show();
}

// Open Edit Extension Modal
function openEditExtensionModal(name, password, did, server) {
  document.getElementById("editExtensionName").value = name;
  document.getElementById("editExtensionPassword").value = password;
  document.getElementById("editDID").value = did;
  document.getElementById("editServerAddress").value = server;

  const modal = new bootstrap.Modal(
    document.getElementById("editExtensionModal")
  );
  modal.show();
}
// Open Add User Modal


// Open Edit User Modal
// function openEditUserModal(
//   firstName,
//   lastName,
//   email,
//   userType,
//   extensionNumber
// ) {
//   document.getElementById("editFirstName").value = firstName;
//   document.getElementById("editLastName").value = lastName;
//   document.getElementById("editEmail").value = email;
//   document.getElementById("editUserType").value = userType;
//   document.getElementById("editExtensionNumber").value = extensionNumber;

//   const modal = new bootstrap.Modal(document.getElementById("editUserModal"));
//   const isDarkMode = document.body.classList.contains("dark-mode");

//   // Set modal styles based on the theme
//   const modalContent = document.querySelector("#editUserModal .modal-content");
//   if (isDarkMode) {
//     modalContent.style.backgroundColor = "#121212"; // Dark background
//     modalContent.style.color = "#ffffff"; // Light text
//   } else {
//     modalContent.style.backgroundColor = "#fff"; // Light background
//     modalContent.style.color = "#000"; // Dark text
//   }

//   modal.show();
// }

// Toggle between dark and light themes by adding/removing "dark" on the <html> element.
function toggleTheme() {
  const isDarkMode = document.body.classList.toggle("dark-mode");
  const modals = document.querySelectorAll(".modal-content");
  modals.forEach((modal) => {
    if (isDarkMode) {
      modal.style.backgroundColor = "#1e1e1e"; // Dark background
      modal.style.color = "#f1f1f1"; // Light text
    } else {
      modal.style.backgroundColor = "#fff"; // Light background
      modal.style.color = "#000"; // Dark text
    }
  });
}

// Toggle the sidebar on mobile
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("hidden");
}
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
let contactCount = 1;

function addContactField() {
  contactCount++;
  const contactNumbers = document.getElementById("contactNumbers");

  const col = document.createElement("div");
  col.className = "col-md-6 mb-2";

  col.innerHTML = `
    <div class="d-flex align-items-center">
        <input type="text" class="form-control me-2" id="contactNumber${contactCount}" placeholder="Contact Number ${contactCount}" required>
        <button type="button" class="btn btn-danger" onclick="removeContactField(this)">Remove</button>
    </div>
`;

  contactNumbers.appendChild(col);
}

function removeContactField(button) {
  const colDiv = button.closest(".col-md-6");
  if (colDiv) {
    colDiv.remove();
    contactCount--;
  }

  // Optionally re-number inputs if needed
  reindexContactFields();
}

function reindexContactFields() {
  const inputs = document.querySelectorAll(
    '#contactNumbers input[type="text"]'
  );
  contactCount = 0;
  inputs.forEach((input, index) => {
    contactCount = index + 1;
    input.id = `contactNumber${contactCount}`;
    input.placeholder = `Contact Number ${contactCount}`;
  });
}

function updateSidebarLinks() {
  const menuLinks = document.querySelectorAll("#sidebar a");
  menuLinks.forEach((link) => {
    const menuName = link.textContent.trim().toLowerCase();
    link.setAttribute("data-menu", menuName); // Set the data-menu attribute
  });
}

// Call this function to update sidebar links after the DOM is loaded
document.addEventListener("DOMContentLoaded", updateSidebarLinks);

// function setupDashboard(userType) {
//   const superadminDiv = document.getElementById("superadmin");
//   const adminDiv = document.getElementById("admin");

//   if (userType === "Super Admin") {
//     superadminDiv.classList.remove("hidden");
//     adminDiv.classList.add("hidden");
//     loadScript("superadmin.js");
//   } else if (userType === "Admin") {
//     adminDiv.classList.remove("hidden");
//     superadminDiv.classList.add("hidden");
//     loadScript("admin.js");
//   }
// }

// function loadScript(src) {
//   const script = document.createElement("script");
//   script.src = src;
//   script.type = "text/javascript";
//   script.defer = true;
//   document.body.appendChild(script);
// }

function showSection(id) {
  const sections = document.querySelectorAll(".section");
  const menuItems = document.querySelectorAll("#sidebar a");
  const companySelect = document.getElementById("companySelect");

  sections.forEach((section) => section.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");

  menuItems.forEach((item) => {
    item.classList.remove("active-menu");
    if (item.getAttribute("data-menu") === id) {
      item.classList.add("active-menu");
    }
  });

  // Hide companySelect when dashboard is active
  if (id === "users" || id === "extension") {
    companySelect.classList.remove("hidden");
  } else {
    companySelect.classList.add("hidden");
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
  logout();
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
        console.log(data);
        console.log("UUID received:", uuid);
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
      fetch(`${localurl}user/otpexpire/`, {
        method: "GET",
      })
        .then((response) => response.json())
        .then((data) => console.log("OTP expired:", data))
        .catch((err) => console.error("Expire call failed:", err));
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
        console.log("Correct OTP");
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
  console.log("OTP", email);
  document.getElementById("mainPage").style.display = "none";
  document.getElementById("forgotPasswordModal").style.display = "none";
  document.getElementById("OTPModal").style.display = "none";
  document.getElementById("pwdModal").style.display = "block";
}

//Change Password Page from Login Screen
function changePwd() {
  const email = document.getElementById("usernameForgotInput").value;
  const pwd = document.getElementById("newPwd").value;
  console.log("pwd", pwd);
  const rpwd = document.getElementById("cnewPwd").value;
  console.log("rpwd", rpwd);

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
        console.log("Password Change");
        Alert(
          "Your Password has changed successfully. Press OK to continue",
          "Success",
          function () {
            console.log("OK pressed!");
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
  console.log("calling login userrrrrrrrrr");
  const username = document.getElementById("usernamenewInput").value;
  console.log(username);
  const password = document.getElementById("passwordnewInput").value;
  console.log(password);
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
      console.log("response data", data);
      if (
        data.success &&
        data.data.extension &&
        data.data.extension.length > 0
      ) {
        let sdata = data.data;
        let fullName = data.data.firstName + " " + data.data.lastName;
        let email = data.data.email;
        let userType = data.data.userType;
        console.log(userType);
        localStorage.setItem("sdata", JSON.stringify(sdata));
        localStorage.setItem("fullName", JSON.stringify(fullName));
        localStorage.setItem("email", JSON.stringify(email));

        let extension = data.data.extension[0]; // Get the first extension
        let sipuser = {
          tenant: extension.name,
          mailbox: extension.phone,
          ext: extension.username,
          pw: extension.password,
          callerid: extension.callerid,
          displayname: extension.displayname,
          key: extension.realm,
          wssServer: extension.serveraddress,
        };

        // Store as JSON string
        localStorage.setItem("sipuser", JSON.stringify(sipuser));
        console.log("Stored sipuser:", sipuser);
        if (data.message == "New Login") {
          console.log("NEW LOGIN");
          Alert(
            "New Login",
            "Enter your desired password on next screen!",
            function () {
              console.log("OK pressed!");
              tempPass();
            }
          );
        } else {
          loadScript('script.js');
          setupDashboard(userType);
        }
      } else {
        console.error("Error:", data.error);
        // Alert("Inncorrect Email or Password.", "Try Again", function () {
        //   console.log("OK pressed!");
        // });

        //showNotification();
      }
    })
    .catch((error) => {
      console.log("403 Email Error", error);
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
  console.log("pwd", tpwd);
  const rtpwd = document.getElementById("tnewPwd").value;
  console.log("rpwd", rtpwd);

  if (!tpwd) {
    Alert("Please enter the Password.");
    return;
  }
  if (tpwd != rtpwd) {
    Alert("Password Doesnot match");
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
        console.log("Password Change");
        Alert(
          "Your Password has changed successfully. Press OK to continue",
          "Success",
          function () {
            console.log("OK pressed!");
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



function setupDashboard(userType) {
  console.log(userType);
  const superadminDiv = document.getElementById("superadmin");
  const adminDiv = document.getElementById("admin");

  if (userType === "superadmin") {
    superadminDiv.classList.remove("hidden");
    adminDiv.classList.add("hidden");
    document.getElementById("loginModal").style.display = "none";
    document.getElementById("superadmin").style.display = "contents";
    loadScript("superadmin.js");
  } else if (userType === "admin") {
    adminDiv.classList.remove("hidden");
    superadminDiv.classList.add("hidden");
    document.getElementById("loginModal").style.display = "none";
    document.getElementById("admin").style.display = "contents";
    loadScript("admin.js");
  }
}

function loadScript(src) {
  const script = document.createElement('script');
  script.src = src;
  script.type = 'text/javascript';
  script.defer = true;
  document.body.appendChild(script);
}

