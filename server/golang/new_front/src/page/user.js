import { Router } from "https://unpkg.com/@vaadin/router@1.7.4/dist/vaadin-router.js";
import {
  LitElement,
  html,
} from "https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js";
import System from "./../system.js";
toastr.options = {
  closeButton: false,
  debug: false,
  newestOnTop: false,
  progressBar: true,
  positionClass: "toast-top-right",
  preventDuplicates: false,
  onclick: null,
  showDuration: "100",
  hideDuration: "1000",
  timeOut: "1500",
  extendedTimeOut: "1000",
  showEasing: "swing",
  hideEasing: "linear",
  showMethod: "fadeIn",
  hideMethod: "fadeOut",
};
/**
 * @type {System}
 */
const system = new System();

class login extends LitElement {
  constructor() {
    super();
    this.username = "";
    this.password = "";
  }

  async login() {
    const token = await system.user.Login(this.username, this.password);
    if (token == false) {
      toastr.error("Login Fail");
    } else {
      toastr.success("Login Success");
      localStorage.setItem("token", token);
      Router.go("/");
    }
  }
  render() {
    return html`<main class="container">
        <article class="grid">
          <div>
            <hgroup>
              <h1>Sign in</h1>
              <h2>wow</h2>
            </hgroup>
            <form onsubmit="return false">
              <input
                type="text"
                name="login"
                placeholder="Login"
                aria-label="Login"
                autocomplete="nickname"
                @change=${(e) => {
                  this.username = e.target.value;
                }}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                aria-label="Password"
                autocomplete="current-password"
                required
                @change=${(e) => {
                  this.password = e.target.value;
                }}
              />
              <button type="submit" class="contrast" @click=${this.login}>
                Login
              </button>
            </form>
          </div>
        </article>
      </main>

      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css"
      />`;
  }
}
class register extends LitElement {
  constructor() {
    super();
    this.username = "";
    this.password = "";
  }
  async register() {
    const data = await system.user.Register(this.username, this.password);
    if (data == false) {
      toastr.error("Register Fail");
    } else {
      toastr.success("Register Success");
      Router.go("/user/login");
    }
  }
  render() {
    return html`<main class="container">
        <article class="grid">
          <div>
            <hgroup>
              <h1>Register</h1>
              <h2>join Dan-Music</h2>
            </hgroup>
            <form onsubmit="return false">
              <input
                type="text"
                name="login"
                placeholder="Login"
                aria-label="Login"
                autocomplete="nickname"
                @change=${(e) => {
                  this.username = e.target.value;
                }}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                aria-label="Password"
                autocomplete="current-password"
                required
                @change=${(e) => {
                  this.password = e.target.value;
                }}
              />
              <button type="submit" class="contrast" @click=${this.register}>
                Register
              </button>
            </form>
          </div>
        </article>
      </main>

      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css"
      />`;
  }
}
customElements.define("register-page", register);
customElements.define("user-page", login);
