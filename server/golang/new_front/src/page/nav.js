import { Router } from "https://unpkg.com/@vaadin/router@1.7.4/dist/vaadin-router.js";
import { html } from "https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js";
import System from "../system.js";
const system = new System();

export let nav = (name) => html`
  <nav class="container-fluid">
    <ul>
      <li>
        <a
          href="./"
          class="contrast"
          @click=${() => {
            Router.go("/");
          }}
          ><strong>Dan-Music</strong></a
        >
      </li>
    </ul>
    <ul>
      <li>
        <details role="list" dir="rtl">
          <summary aria-haspopup="listbox" role="link" class="secondary">
            ${name}
          </summary>
          <ul role="listbox">
            <li>
              <a
                @click=${() => {
                  Router.go("/server_download");
                }}
                >Server Download</a
              >
            </li>
            <li>
              <a
                @click=${() => {
                  system.user.Logout();
                  Router.go("/user/login");
                }}
                >logout</a
              >
            </li>
          </ul>
        </details>
      </li>
    </ul>
  </nav>
`;
