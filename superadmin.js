// const apiUrl = "http://172.31.199.45:5000";
const apiUrl = "https://voiceapi.shuklais.com";
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
      fetchExtensions(selectedCode);
      localStorage.setItem("selectedId", JSON.stringify(selectedId));
    });
  })
  .catch((error) => console.error("Error fetching companies:", error));

function fetchUsers(companyCode) {
  console.log("Fetching extensions for:", companyCode);
  const selectedCode = companyCode;
  localStorage.setItem("selectedCode", JSON.stringify(selectedCode));
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

    row.innerHTML = `
      <td class="px-4 py-1">${user.firstName || ""}</td>
      <td class="px-4 py-1">${user.lastName || ""}</td>
      <td class="px-4 py-1">${user.email || ""}</td>
      <td class="px-4 py-1">${user.userType || ""}</td>
      <td class="px-4 py-1">${user.is_active ? "Yes" : "No"}</td>
      <td class="px-4 py-1">${ext.username || "-"}</td>
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
    passwordBtn: document.getElementById("submitPasswordBtn"),
    passwordInput: document.getElementById("editPasswordInput"),
  };

  const ext = user.extension || [];
  const exts = ext[0] || {};
  const companyName = user.company?.companyName;
  let selectedCompanyID = user.company?.id;
  let isActiveValue = user.is_active;
  let selectedIds = [];
  let extensionData = [];

  formFields.isActiveCheckbox.checked = isActiveValue;
  formFields.isActiveCheckbox.onchange = () =>
    (isActiveValue = formFields.isActiveCheckbox.checked);

  formFields.firstName.value = user.firstName || "";
  formFields.lastName.value = user.lastName || "";
  formFields.email.value = user.email || "";
  formFields.userType.value = user.userType || "";
  formFields.extensionSelect.value = exts.username || "";

  fetch(`${apiUrl}/company/listCompany`)
    .then((res) => res.json())
    .then((data) => {
      const sorted = data.success.sort((a, b) =>
        a.companyName.localeCompare(b.companyName)
      );
      formFields.companySelect.innerHTML = "";

      sorted.forEach((company) => {
        const option = document.createElement("option");
        option.value = company.id;
        option.text = company.companyName;
        if (company.companyName === companyName) {
          option.selected = true;
          selectedCompanyID = company.id;
        }
        formFields.companySelect.appendChild(option);
      });

      if (tomSelectInstance) tomSelectInstance.destroy();
      tomSelectInstance = new TomSelect(formFields.companySelect, {
        create: false,
        searchField: ["text"],
        sortField: { field: "text", direction: "asc" },
        onChange(value) {
          selectedCompanyID = value;
        },
      });
    });

  const modal = new bootstrap.Modal(document.getElementById("editUserModal"));
  modal.show();

  const isDarkMode = document.body.classList.contains("dark-mode");
  const modalContent = document.querySelector("#editUserModal .modal-content");
  modalContent.style.backgroundColor = isDarkMode ? "#121212" : "#fff";
  modalContent.style.color = isDarkMode ? "#fff" : "#000";

  fetch(`${apiUrl}/user/listExtension`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company_all: user.company?.code }),
  })
    .then((res) => res.json())
    .then((result) => {
      extensionData = result || [];
      const usernames = [
        ...new Set(extensionData.map((item) => item.username)),
      ];
      formFields.extensionSelect.innerHTML =
        '<option value="">-- Select Extension --</option>';

      usernames.forEach((username) => {
        const option = document.createElement("option");
        option.value = username;
        option.textContent = username;
        formFields.extensionSelect.appendChild(option);
      });

      formFields.extensionSelect.value = exts.username?.trim() || "";
      formFields.extensionSelect.dispatchEvent(new Event("change"));
    });

  formFields.extensionSelect.onchange = function () {
    const selectedUsername = this.value;
    formFields.idList.innerHTML = "";

    const matching = extensionData.filter(
      (item) => item.username === selectedUsername
    );
    matching.forEach((item) => {
      const li = document.createElement("li");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = item.id;

      if (ext.find((ts) => ts.id === item.id)) {
        checkbox.checked = true;
        selectedIds.push(item.id);
      }

      checkbox.onchange = function () {
        const id = parseInt(this.value);
        if (this.checked) {
          if (!selectedIds.includes(id)) selectedIds.push(id);
        } else {
          selectedIds = selectedIds.filter((i) => i !== id);
        }
      };

      li.appendChild(checkbox);
      li.appendChild(
        document.createTextNode(
          ` ID: ${item.id} (${item.formatedPhone || item.phone})`
        )
      );
      formFields.idList.appendChild(li);
    });
  };

  formFields.saveBtn.onclick = () => {
    const updatedUser = {
      userid: user.uuid,
      firstName: formFields.firstName.value,
      lastName: formFields.lastName.value,
      userType: formFields.userType.value,
      email: formFields.email.value,
      extension: selectedIds,
      company: selectedCompanyID,
      is_active: isActiveValue,
    };

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
  const storedId = localStorage.getItem("selectedId");
  console.log("storedId", storedId);
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
    saveBtn: document.getElementById("addUserBtn"),
  };
  var companyId = localStorage.getItem("selectedId");

  formFields.saveBtn.onclick = () => {
    const payload = {
      firstName: formFields.firstName.value,
      lastName: formFields.lastName.value,
      email: formFields.email.value,
      password: "9qM`nk+ACbd!{2+B", // default password
      company: companyId, // assuming company select uses value=id
    };

    fetch(`${apiUrl}/user/userregister`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(payload);
        console.log("Add user response:", data);
        if (data.success) {
          const selectedCode = JSON.parse(localStorage.getItem("selectedCode"));
          fetchUsers(selectedCode); // refresh user table
          modal.hide();
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

function fetchExtensions(companyCode) {
  fetch(`${apiUrl}/user/listExtension`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company_all: companyCode }),
  })
    .then((res) => res.json())
    .then((data) => {
      const extensions = data || [];
      renderExtensions(extensions);
    })
    .catch((error) => console.error("Error fetching extensions:", error));
}
function renderExtensions(extensions) {
  const tbody = document.querySelector("#extensionTable tbody");
  const fragment = document.createDocumentFragment();
  tbody.innerHTML = "";

  extensions.forEach((ext) => {
    const row = document.createElement("tr");
    row.className = "odd:bg-gray-50 dark:odd:bg-gray-700";
    row.style.cursor = "pointer";
    row.onclick = () => editExtension(ext);

    row.innerHTML = `
      <td class="px-4 py-1">${ext.username}</td>
      <td class="px-4 py-1">${ext.password || "-"}</td>
      <td class="px-4 py-1">${ext.formatedPhone || ext.phone || "-"}</td>
      <td class="px-4 py-1">${ext.serveraddress || "-"}</td>
    `;

    fragment.appendChild(row);
  });

  tbody.appendChild(fragment);
}
function editExtension(ext) {
  const modal = new bootstrap.Modal(
    document.getElementById("editExtensionModal")
  );
  const isDarkMode = document.body.classList.contains("dark-mode");

  // Apply modal theme
  const modalContent = document.querySelector(
    "#editExtensionModal .modal-content"
  );
  modalContent.style.backgroundColor = isDarkMode ? "#121212" : "#fff";
  modalContent.style.color = isDarkMode ? "#fff" : "#000";

  // Fill form fields
  document.getElementById("editExtensionName").value = ext.username || "";
  document.getElementById("editExtPassword").value = ext.password || "";
  document.getElementById("editDID").value = ext.phone || "";
  document.getElementById("editExtVoicemail").value = ext.voicemail || "";
  document.getElementById("editServerAddress").value = ext.serveraddress || "";
  document.getElementById("editExtOther").value = ext.other || "";
  modal.show();

  // Save handler
  document.getElementById("saveExtensionBtn").onclick = () => {
    const payload = {
      id: ext.id,
      serveraddress: document.getElementById("editServerAddress").value,
      username: document.getElementById("editExtensionName").value,
      password: document.getElementById("editExtPassword").value,
      phone: document.getElementById("editDID").value,
      company: ext.company, // Make sure this matches your backend
      voicemail: document.getElementById("editExtVoicemail").value,
      other: document.getElementById("editExtOther").value,
    };
    var extId = ext.id;
    fetch(`${apiUrl}/user/extension-add-edit/${extId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((response) => {
        if (response.success) {
          alert("Extension updated successfully!");
          modal.hide();
          fetchExtensions(ext.company); // Refresh list
        } else {
          alert(response.error || "Update failed");
          console.log(payload);
        }
      })
      .catch((err) => {
        console.error("Error updating extension:", err);
        alert("Something went wrong.");
      });
  };
}
