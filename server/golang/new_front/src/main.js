import { Router } from "https://unpkg.com/@vaadin/router@1.7.4/dist/vaadin-router.js";
import {
  LitElement,
  html,
} from "https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js";
import "./page/user.js";
import "./page/home.js";
import "./page/download.js";
import "./page/playlist.js";

const router = new Router(document.querySelector("body"));
router.setRoutes([
  { path: "/", component: "home-page" },
  { path: "/server_download", component: "server-download-page" },
  { path: "/user/login", component: "user-page" },
  { path: "/user/register", component: "register-page" },
  { path: "/playlist/:id", component: "playlist-page" },
  { path: "(.*)", component: "page404-page" },
]);

class page404 extends LitElement {
  render() {
    return html` <h1>404 Page Not Found</h1> `;
  }
}
customElements.define("page404-page", page404);
