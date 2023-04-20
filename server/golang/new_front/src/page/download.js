import { Router } from "https://unpkg.com/@vaadin/router@1.7.4/dist/vaadin-router.js";
import {
  LitElement,
  html,
} from "https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js";
import System from "./../system.js";

import { nav } from "./nav.js";
const system = new System();

class serverdownload extends LitElement {
  constructor() {
    super();
    this.list = [];
    this.name = "null";
    system.user.checkToken().then((data) => {
      if (!data) {
        Router.go("/user/login");
      }
      this.name = data;
      this.loop = setInterval(this.load, 5000);
      this.requestUpdate();
    });
  }
  async load() {
    let data = await fetch("/file/downloadlist").then(async (data) => {
      return await data.json();
    });
    this.list = data.list;
    console.log(this.list);
    this.requestUpdate();
  }
  render() {
    return html`
      ${nav(this.name)}
      <main class="container">
        <h1>Download</h1>
        <table>
          <tr>
            <th>url</th>
          </tr>
          ${this.list.map(
            (item) => html` <tr>
              <th>${item}</th>
            </tr>`
          )}
        </table>
      </main>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css"
      />
    `;
  }
}

customElements.define("server-download-page", serverdownload);
