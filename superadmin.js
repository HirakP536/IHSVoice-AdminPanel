const apiUrl = "http://172.31.199.45:5000";
//const apiUrl = "https://voiceapi.shuklais.com";
// Optimized version of superadmin.js
let tomSelectInstance;
let userMap = new Map();
const storedData = JSON.parse(localStorage.getItem("sdata"));
console.log(storedData);
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

document.getElementById("profileName").innerHTML = capitalize(
  storedData.firstName
);
document.getElementById("fullName").innerHTML = `${capitalize(
  storedData.firstName
)} ${capitalize(storedData.lastName)}`;
document.getElementById("email").innerHTML = storedData.email;
var selectedId = "";
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
        fetchUsers(company.code);
        localStorage.setItem("selectedId", JSON.stringify(company.id)); // Set the first one by default
      }

      select.appendChild(option);
    });
    select.dispatchEvent(new Event("change"));
    if (tomSelectInstance) tomSelectInstance.destroy();
    tomSelectInstance = new TomSelect(select, {
      create: false,
      searchField: ["text"],
      sortField: { field: "text", direction: "asc" },
      onInitialize() {
        let cleared = false;
        this.control_input.addEventListener("keydown", () => {
          if (!cleared && this.items.length > 0) {
            this.clear(true);
            cleared = true;
          }
        });
        this.control_input.addEventListener("blur", () => (cleared = false));
      },
    });

    select.addEventListener("change", () => {
      const selectedOption = select.options[select.selectedIndex];
      const selectedId = selectedOption.dataset.id;
      const selectedCode = select.value;
      fetchUsers(selectedCode);
      // fetchExtensions(selectedCode);
      localStorage.setItem("selectedId", JSON.stringify(selectedId));
    });
  })
  .catch((error) => console.error("Error fetching companies:", error));

function fetchUsers(companyCode) {
  console.log("Fetching extensions for:", companyCode);
  const selectedCode = companyCode;
  localStorage.setItem("selectedCode", selectedCode);
  fetch(`${apiUrl}/user/listUser/${companyCode}`)
    .then((res) => res.json())
    .then((data) => {
      const users = data.success || [];
      userMap.clear();
      users.forEach((user) => userMap.set(user.uuid, user));
      renderUsers(users);
    })
    .catch((error) => console.error("Error fetching users:", error));
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
    console.log("infoinrow", user);
    row.innerHTML = `
      <td class="px-4 py-1">${user.firstName || ""}</td>
      <td class="px-4 py-1">${user.lastName || ""}</td>
      <td class="px-4 py-1">${user.email || ""}</td>
      <td class="px-4 py-1">${user.userType || ""}</td>
      <td class="px-4 py-1">${user.is_active ? "Yes" : "No"}</td>
      <td class="px-4 py-1">${user.city || "-"}</td>
      <td class="px-4 py-1">
        <button class="btn btn-sm btn-success" onclick='event.stopPropagation(); sendUserById("${
          user.uuid
        }")'>Send</button>
      </td>
    `;
    fragment.appendChild(row);
  });

  tbody.appendChild(fragment);
}

function editUserById(uuid) {
  const user = userMap.get(uuid);

  if (!user) return;

  const formFields = {
    firstName: document.getElementById("editFirstName"),
    lastName: document.getElementById("editLastName"),
    email: document.getElementById("editEmail"),
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

  const currentExt = user.city; // value132 for extension
  const currentDIDs = user.reponse || []; // Assuming response contains the selected DIDs
  const tenant = user.company.code;
  console.log("tenant", tenant);
  // Fetch and populate the company select dropdown
  
  const modal = new bootstrap.Modal(document.getElementById("editUserModal"));
  modal.show();

  const isDarkMode = document.body.classList.contains("dark-mode");
  const modalContent = document.querySelector("#editUserModal .modal-content");
  modalContent.style.backgroundColor = isDarkMode ? "#121212" : "#fff";
  modalContent.style.color = isDarkMode ? "#fff" : "#000";
  // Fetch extensions
  const apiKey = "trL9cGpdP6WW9Y9z"; // Replace with real key
  const extUrl = `https://sip5.houstonsupport.com/pbx/proxyapi.php?reqtype=INFO&tenant=${tenant}&format=json&key=${apiKey}&info=extensions`;

  fetch(extUrl)
    .then((response) => response.json())
    .then((data) => {
      extensionData = data.map((item) => ({
        value132: item[132], // Extract value132
        value133: item[133], // Extract value133
      }));

      const value132Set = [
        ...new Set(extensionData.map((item) => item.value132)),
      ];

      formFields.extensionSelect.innerHTML =
        '<option value="">-- Select Extension --</option>';

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
        value132: extensionData[selectedIndex].value132,
        value133: extensionData[selectedIndex].value133,
      };
    } else {
      selectedValues = {};
    }
    console.log("Selected Extension:", selectedValues);
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
          const label = item[5] ? `${item[5]} - ${fullNumber}` : fullNumber;
          return { fullNumber, label };
        });
      console.log("dids", data);

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

        // ✅ Pre-select if value exists in currentDIDs
        if (currentDIDs.includes(didItem.label)) {
          checkbox.checked = true;
          selectedDIDs.push(didItem.label); // Add to array
        }

        // 🔄 Update selectedDIDs on change
        checkbox.onchange = function () {
          if (this.checked) {
            if (!selectedDIDs.includes(this.value)) {
              selectedDIDs.push(this.value);
            }
          } else {
            selectedDIDs = selectedDIDs.filter((did) => did !== this.value);
          }
          console.log("Selected DIDs:", selectedDIDs);
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
      city: selectedValues.value132 || "", // Set city with value132 (extension value)
      state: selectedValues.value133 || "", // Set state with value133 (extension value)
      response: JSON.stringify(selectedDIDs), // Store selected DIDs in response array
      company: selectedCompanyID,
      is_active: isActiveValue,
    };
    console.log(updatedUser);
    fetch(`${apiUrl}/user/editTokenUpdate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedUser),
    })
      .then((res) => res.json())
      .then(() => {
        fetchUsers(user.company?.code);
        modal.hide();
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
      const type = editPasswordInput.type === "password" ? "text" : "password";
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
            Alert(
              "Your Password has changed successfully. Press OK to continue",
              "Success",
              () => {}
            );
          } else {
            Alert(data.error || "Try again.");
          }
        });
    };
  };
}
function sendUserById(uuid) {
  const user = userMap.get(uuid);
  console.log(user);
  var userId = user.id;
  console.log(userId);
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
      console.log("Notification response:", data);
      alert("Notification sent successfully!");
    })
    .catch((error) => {
      console.error("Error sending notification:", error);
      alert("Failed to send notification");
    });
}

function openAddUserModal() {
  const modal = new bootstrap.Modal(document.getElementById("addUserModal"));
  const isDarkMode = document.body.classList.contains("dark-mode");
  // Style the modal according to theme
  const modalContent = document.querySelector("#addUserModal .modal-content");
  modalContent.style.backgroundColor = isDarkMode ? "#121212" : "#fff";
  modalContent.style.color = isDarkMode ? "#ffffff" : "#000000";

  modal.show();

  // Get values from form
  const formFields = {
    firstName: document.getElementById("firstName"),
    lastName: document.getElementById("lastName"),
    email: document.getElementById("addEmail"),
    userType: document.getElementById("userType"),
    extensionSelect: document.getElementById("addextensionSelect"),
    didSelect: document.getElementById("adddidSelect"),
    saveBtn: document.getElementById("addUserBtn"),
  };

  // Get the company ID from local storage
  const companyId = localStorage.getItem("selectedId");
  const tenantName = localStorage.getItem("selectedCode");
  console.log("storedId", tenantName);
  const apiKey = "trL9cGpdP6WW9Y9z"; // Replace with real key
  const extUrl = `https://sip5.houstonsupport.com/pbx/proxyapi.php?reqtype=INFO&tenant=${tenantName}&format=json&key=${apiKey}&info=extensions`;
  console.log(extUrl);
  let extensionData = [];
  let selectedValues = {
    value132: "",
    value133: "",
  };

  fetch(extUrl)
    .then((response) => response.json())
    .then((data) => {
      // Map extension data to array of objects with value132 and value133
      extensionData = data.map((item) => ({
        value132: item[132], // Extension number
        value133: item[133], // Extra info (state)
      }));

      // Create a set of unique value132s for dropdown
      const value132Set = [
        ...new Set(extensionData.map((item) => item.value132)),
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
          value132: "",
          value133: "",
        };

        // Assign values if a valid index is selected
        if (!isNaN(selectedIndex) && extensionData[selectedIndex]) {
          selectedValues.value132 = extensionData[selectedIndex].value132;
          selectedValues.value133 = extensionData[selectedIndex].value133;
        }

        console.log("Selected Extension Data:", selectedValues);
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
        checkbox.value = fullNumber;
        checkbox.classList.add("me-2");
        checkbox.name = "didCheckbox";

        const checkboxLabel = document.createElement("label");
        checkboxLabel.classList.add("form-check-label");
        checkboxLabel.textContent = label;

        // ✅ Update addselectedDIDs on checkbox change
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
          console.log("Selected DIDs:", addselectedDIDs);
        };

        const div = document.createElement("div");
        div.classList.add("form-check");
        div.appendChild(checkbox);
        div.appendChild(checkboxLabel);
        formFields.didSelect.appendChild(div);
      });
    })
    .catch((err) => console.error("Error fetching DIDs:", err));

  // Save button click handler
  formFields.saveBtn.onclick = () => {
    const selectedDIDs = [];
    const selectedExtension = formFields.extensionSelect.value;

    // Get selected DIDs
    const checkboxes = document.querySelectorAll(
      'input[name="didCheckbox"]:checked'
    );
    checkboxes.forEach((checkbox) => selectedDIDs.push(checkbox.value));

    const payload = {
      firstName: formFields.firstName.value,
      lastName: formFields.lastName.value,
      email: formFields.email.value,
      password: "9qM`nk+ACbd!{2+B",
      company: companyId,
      city: selectedValues.value132 || "",
      state: selectedValues.value133 || "",
      response: JSON.stringify(addselectedDIDs),
      userType: formFields.userType.value,
    };
    console.log(payload);
    fetch(`${apiUrl}/user/userregister`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Add user response:", data);

        if (data.success) {
          console.log("starting");
          const selectedCode = localStorage.getItem("selectedCode");
          console.log("selectedCode", selectedCode);
          fetchUsers(selectedCode); // Refresh user table
          modal.hide();
          console.log("ending");
        } else {
          alert(data.error || "Failed to add user.");
        }
      })
      .catch((err) => {
        console.error("Error adding user:", err);
        alert("Something went wrong while adding the user.");
      });
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
