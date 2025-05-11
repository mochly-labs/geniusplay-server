const ws = new WebSocket("wss://geniusplay-server.onrender.com"); // Change to your actual WS URL
let turnstileToken = null;

function send(type, data) {
  console.log(data);
  ws.send(JSON.stringify({ type, ...data }));
}

function showTab(tabName) {
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("registerForm").classList.add("hidden");

  document
    .getElementById("loginTab")
    .classList.remove("border-b-2", "border-blue-500");
  document
    .getElementById("registerTab")
    .classList.remove("border-b-2", "border-blue-500");

  if (tabName === "login") {
    document.getElementById("loginForm").classList.remove("hidden");
    document
      .getElementById("loginTab")
      .classList.add("border-b-2", "border-blue-500");
  } else {
    document.getElementById("registerForm").classList.remove("hidden");
    document
      .getElementById("registerTab")
      .classList.add("border-b-2", "border-blue-500");
  }
}

document.getElementById("loginTab").addEventListener("click", () => {
  showTab("login");
});

document.getElementById("registerTab").addEventListener("click", () => {
  showTab("register");
});

document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;
  send("auth", { username, password });
});

document.getElementById("registerForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;
  const name = document.getElementById("register-name").value;
  const email = document.getElementById("register-email").value;
  send("register", { username, password, name, email, turnstileToken });
});

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(event)
  if (data.type === "error") {
    alert(data.message);
  } else if (data.type === "auth") {
    document.querySelector(".login").classList.add("hidden");
    document.querySelector(".dashboard").classList.remove("hidden");
    document.getElementById("username").textContent = data.user.name;
    if (data.user.institution) {
      document.querySelector(".criar-instituicao").classList.add("hidden");
      document.querySelector(".instituicao").classList.remove("hidden");
      document.getElementById("institution-name").textContent =
        data.user.institutionName;
      document.getElementById("institution-shortname").textContent =
        " (" + data.user.institutionShortname + ")";
    } else {
      document.querySelector(".criar-instituicao").classList.remove("hidden");
      document.querySelector(".instituicao").classList.add("hidden");
    }
  } else if (data.type === "set-institution") {
    if (data.success && data.institution) {
      document.querySelector(".criar-instituicao").classList.add("hidden");
      document.querySelector(".instituicao").classList.remove("hidden");
    } else {
      document.querySelector(".criar-instituicao").classList.remove("hidden");
      document.querySelector(".instituicao").classList.add("hidden");
    }
  } else if (data.type === "register") {
    if (data.success) {
      // eslint-disable-next-line no-undef
      Swal.fire({
        title: "Conta criada com sucesso!",
        icon: "success",
        text: "Agora você pode fazer login!",
      });
    } else {
      // eslint-disable-next-line no-undef
      Swal.fire({
        title: "Erro ao criar conta!",
        icon: "error",
        text: data.error,
      });
    }
  }
};

document.getElementById("leave-institution").addEventListener("click", () => {
  send("set-institution", { institution: "none" });
});

document.getElementById("join-institution").addEventListener("submit", (e) => {
  e.preventDefault();
  const invite = document.getElementById("invite-code").value;
  console.log(invite);
  send("set-institution", { institution: invite });
});

document.getElementById("create-institution").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const short_name = document.getElementById("shortname").value;
  const invite = document.getElementById("invite").value;

  send("create-institution", { full_name: name, short_name, invite });
});

// eslint-disable-next-line no-unused-vars
function turnstileResponse(token) {
  turnstileToken = token;
}