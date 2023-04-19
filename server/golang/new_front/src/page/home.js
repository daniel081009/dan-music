import { Router } from "https://unpkg.com/@vaadin/router@1.7.4/dist/vaadin-router.js";
import {
  LitElement,
  html,
} from "https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js";
import System from "./../system.js";
import { nav } from "./nav.js";
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

const isOpenClass = "modal-is-open";
const openingClass = "modal-is-opening";
const closingClass = "modal-is-closing";
const animationDuration = 400; // ms
let visibleModal = null;

class home extends LitElement {
  constructor() {
    super();
    /**
     * @type {Object.<string, import("../playlists.js").Playlistty>}
     */
    this.playlists = {};
    /**
     * @type {object}
     * @property {string} Name Name
     * @property {string} Tpye Empty Yt_Playlist
     * @property {boolean} IsPublic Public
     * @property {string} Yt_playlist_Url Youtube Playlist ID
     */
    this.input = {
      IsPublic: false,
      type: "Empty",
    };
    this.loading = false;
  }
  async load() {
    if (this.loading) return;
    this.name = await system.user.checkToken();
    if (this.name == false) {
      toastr.error("Load Fail");
      Router.go("/user/login");
    }
    this.playlists = await system.playlists.GetPlaylists();
    if (this.playlists == null) {
      toastr.error("Load Fail");
      Router.go("/user/login");
    }
    Object.entries(this.playlists).forEach((e) => {
      system.db.set(e[0], e[1]);
    });
    this.loading = true;
    this.requestUpdate();
  }
  createRenderRoot() {
    return this;
  }
  toggleModal(event) {
    event.preventDefault();
    const modal = document.getElementById(
      event.currentTarget.getAttribute("data-target")
    );
    typeof modal != "undefined" && modal != null && isModalOpen(modal)
      ? closeModal(modal)
      : openModal(modal);
  }
  isModalOpen(modal) {
    return modal.hasAttribute("open") && modal.getAttribute("open") != "false"
      ? true
      : false;
  }
  openModal(modal) {
    if (this.isScrollbarVisible()) {
      document.documentElement.style.setProperty(
        "--scrollbar-width",
        this.getScrollbarWidth() + "px"
      );
    }
    document.documentElement.classList.add(isOpenClass, openingClass);
    setTimeout(() => {
      visibleModal = modal;
      document.documentElement.classList.remove(openingClass);
    }, animationDuration);
    modal.setAttribute("open", true);
  }
  closeModal(modal) {
    visibleModal = null;
    document.documentElement.classList.add(closingClass);
    setTimeout(() => {
      document.documentElement.classList.remove(closingClass, isOpenClass);
      document.documentElement.style.removeProperty("--scrollbar-width");
      modal.removeAttribute("open");
    }, animationDuration);
  }
  getScrollbarWidth() {
    const outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.overflow = "scroll"; // forcing scrollbar to appear
    outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps
    document.body.appendChild(outer);

    const inner = document.createElement("div");
    outer.appendChild(inner);

    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

    outer.parentNode.removeChild(outer);

    return scrollbarWidth;
  }
  isScrollbarVisible() {
    return document.body.scrollHeight > screen.height;
  }
  toggleModal(event) {
    event.preventDefault();
    const modal = document.getElementById(
      event.currentTarget.getAttribute("data-target")
    );
    typeof modal != "undefined" && modal != null && this.isModalOpen(modal)
      ? this.closeModal(modal)
      : this.openModal(modal);
  }
  modal() {
    document.addEventListener("click", (event) => {
      if (visibleModal != null) {
        const modalContent = visibleModal.querySelector("article");
        const isClickInside = modalContent.contains(event.target);
        !isClickInside && this.closeModal(visibleModal);
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && visibleModal != null) {
        this.closeModal(visibleModal);
      }
    });
    return html`
      <button
        class="contrast"
        data-target="modal-playlist-create"
        @click=${this.toggleModal}
      >
        Create Playlist
      </button>

      <dialog id="modal-playlist-create">
        <article>
          <a
            href="#close"
            aria-label="Close"
            class="close"
            data-target="modal-playlist-create"
            @click=${this.toggleModal}
          >
          </a>
          <h3>Create Playlist</h3>
          <form onsubmit="return false">
            <div class="grid">
              <fieldset>
                <legend>playlist-type</legend>
                <label>
                  <input
                    type="radio"
                    name="playlist-type"
                    value="Empty"
                    @click=${() => {
                      console.log("Empty");
                      this.input.Type = "Empty";
                      this.requestUpdate();
                    }}
                    checked
                  />
                  Empty
                </label>
                <label
                  ><input
                    type="radio"
                    name="playlist-type"
                    value="Yt_Playlist"
                    @click=${() => {
                      console.log("Yt_Playlist");
                      this.input.Type = "Yt_Playlist";
                      this.requestUpdate();
                    }}
                  />
                  Youtube Playlist</label
                >
              </fieldset>

              <div class="form-group">
                <label for="playlist-public">Public</label>
                <input
                  type="checkbox"
                  id="playlist-public"
                  name="playlist-public"
                  placeholder="Playlist Public"
                  @change=${() => {
                    this.input.IsPublic = !this.input.IsPublic;
                    this.requestUpdate();
                  }}
                />
              </div>
            </div>
            <div class="form-group">
              <label for="playlist-name">Name</label>
              <input
                type="text"
                id="playlist-name"
                name="playlist-name"
                placeholder="Playlist Name"
                @change=${(e) => {
                  console.log(e.target.value);
                  this.input.Name = e.target.value;
                }}
              />
            </div>

            ${this.input.Type == "Yt_Playlist"
              ? html`<div class="form-group">
                  <label for="playlist-name">Youtube Playlist URL</label>
                  <input
                    type="text"
                    id="playlist-url"
                    name="playlist-url"
                    placeholder="Playlist Url"
                    @change=${(e) => {
                      this.input.Yt_playlist_Url = e.target.value;
                    }}
                  />
                </div>`
              : html``}
          </form>
          <footer>
            <a
              href="#cancel"
              role="button"
              class="secondary"
              data-target="modal-playlist-create"
              @click=${this.toggleModal}
            >
              Cancel
            </a>
            <a
              href="#confirm"
              role="button"
              data-target="modal-playlist-create"
              @click=${async () => {
                console.log(this.input);
                if (this.input.Type == "Yt_Playlist") {
                  if (
                    system.playlists.ytplaylistcopy(
                      this.input.Name,
                      this.input.IsPublic,
                      this.input.Yt_playlist_Url
                    ) == false
                  ) {
                    toastr.error("Create Fail");
                  } else {
                    toastr.success("Create Success");
                    this.closeModal(
                      document.getElementById("modal-playlist-create")
                    );
                  }
                } else {
                  if (
                    system.playlists.AddPlaylist(
                      this.input.Name,
                      this.input.IsPublic
                    ) == null
                  ) {
                    toastr.error("Create Fail");
                  } else {
                    toastr.success("Create Success");
                    this.closeModal(
                      document.getElementById("modal-playlist-create")
                    );
                  }
                }
              }}
            >
              Confirm
            </a>
          </footer>
        </article>
      </dialog>

      <style>
        article {
          width: 50vw;
        }
      </style>
    `;
  }

  render() {
    this.load();
    return html`
      ${nav(this.name)}
      <main class="container">
        <figure>
          <table>
            <tr>
              <th><strong>Name</strong></th>
              <th><strong>Admin</strong></th>
              <th><strong>Open</strong></th>
              <th></th>
            </tr>
            ${Object.entries(this.playlists).map(
              ([key, value]) => html`<tr
                @click=${() => {
                  console.log(value);
                  Router.go(`/playlist/${key}`);
                }}
              >
                <th>${value.Name}</th>
                <th>${value.Admin}</th>
                <th>${value.Open}</th>
                <th
                  class="delete"
                  @click=${async () => {
                    console.log(key);
                    const d = confirm("정말로 삭제하시겠습니까?");
                    if (d) {
                      if (
                        (await system.playlists.DeletePlaylist(key)) != null
                      ) {
                        this.loading = false;
                        toastr.success("Delete Success");
                      } else {
                        toastr.error("Delete Fail");
                      }
                    }
                    this.requestUpdate();
                  }}
                >
                  Delete
                </th>
              </tr>`
            )}
          </table>
        </figure>
        ${this.modal()}
      </main>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css"
      />
    `;
  }
}
customElements.define("home-page", home);
