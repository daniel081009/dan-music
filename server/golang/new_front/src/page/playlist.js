import { Router } from "https://unpkg.com/@vaadin/router@1.7.4/dist/vaadin-router.js";
import {
  LitElement,
  html,
} from "https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js";
import { nav } from "./nav.js";
import youtube from "../youtube.js";
import System from "./../system.js";
import play from "../play.js";
const system = new System();
const yt = new youtube();

const isOpenClass = "modal-is-open";
const openingClass = "modal-is-opening";
const closingClass = "modal-is-closing";
const animationDuration = 400; // ms
let visibleModal = null;
//ts-check

class Player {
  constructor(playlist, update) {
    /**
     * @type {import("../playlists.js").Playlistty}
     */
    this.playlist = playlist;
    this.play = new play(this.playlist.Songs, update);
    this.update = update;
  }
  render() {
    return html` <div class="player">
      <div class="play_data">
        <img src=${this.play.songs[this.play.index].relimgurl} />
        <div class="name">${this.play.songs[this.play.index].Name}</div>
      </div>
      <div class="view">
        <progress value=${this.play.progress} max="100"></progress>
        <div class="control">
          <div class="con_pl">
            <img
              src="/src/img/backward-solid.svg"
              @click=${() => {
                this.play.prev();
                this.update();
              }}
            />
            <img
              src=${this.play.playbool
                ? "/src/img/pause-solid.svg"
                : "/src/img/play-solid.svg"}
              @click=${() => {
                this.play.toggle();
                this.update();
              }}
            />
            <img
              src="/src/img/forward-solid.svg"
              @click=${() => {
                this.play.next();
                this.update();
              }}
            />
          </div>
          <img
            src="/src/img/random.svg"
            @click=${() => {
              this.play.random();
              this.update();
            }}
          />
          <img
            src=${this.play.oneloop
              ? "/src/img/loop-1.svg"
              : "/src/img/loop.svg"}
            @click=${() => {
              this.play.oneloop = !this.play.oneloop;
              this.update();
            }}
          />
        </div>
      </div>
      <style>
        .view {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .play_data img {
          height: 9vh;
          height: 9vh;
          object-fit: cover;
          border-radius: 1vh;
        }
        .play_data div {
          margin-left: 1vh;
        }
        .play_data {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .control {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .control img {
          height: 3vh;
        }
        .con_pl {
          display: flex;
        }
        .con_pl img {
          height: 5vh;
        }
        .player {
          width: 100%;
          height: 10vh;
          background-color: #374956;
          border-radius: 10px;
          display: grid;
          grid-template-columns: 1fr 2fr;
        }
        @media (max-width: 482px) {
          .play_data img {
            display: none;
          }
        }
      </style>
    </div>`;
  }
}

class playlist extends LitElement {
  constructor() {
    super();
    /**
     * @type {import("../playlists.js").Playlistty}
     */
    this.playlist = null;
    this.loading = false;
    /**
     * @type {Player}
     */
    this.player = null;
    /**
     * @type {object}
     * @property {number} type 0:youtube 1:local
     * @property {string} name
     * @property {string} url
     * @property {string} img_url
     * @property {string} file
     */
    this.input = {
      type: 0,
      name: "",
      url: "",
      img_url: "",
      file: "",
    };
    this.search = null;
  }
  async load() {
    this.id = new URL(location.href).pathname.split("/")[2];
    if (this.loading) {
      return;
    }
    this.name = await system.user.checkToken();
    if (this.name == false) {
      this.name = "NULL";
    }
    let data = await system.playlists.GetPlaylist(this.id);
    if (data == null) {
      data = await system.db.get(this.id);
      if (data == null) {
        toastr.error("loading fail");
        Router.go("/");
      }
    } else {
      system.db.set(this.id, data);
    }
    this.playlist = data;
    this.player = new Player(this.playlist, () => {
      this.requestUpdate();
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
  toggleModal() {
    const modal = document.getElementById("modal-add-playlist-song");
    typeof modal != "undefined" && modal != null && this.isModalOpen(modal)
      ? this.closeModal(modal)
      : this.openModal(modal);
  }
  modal_add_song_input() {
    if (this.input.type == 0) {
      return html` <div class="form-group">
        <label for="playlist-name">Url(Youtube)</label>
        <div class="titlegrid">
          <input
            type="text"
            id="playlist-Url"
            name="playlist-Url"
            placeholder="Song URL(Youtube)"
            value=${this.input.url}
            @change=${(e) => {
              this.input.name = e.target.value;
            }}
          /><button
            id="gettitle"
            @click=${async () => {
              console.log(this.input.url);
              let id = yt.extractVideoId(this.input.url);
              console.log(id);
              let title = await yt.getvideo(id);
              this.input.name = title;
              document.getElementById("playlist-name").value = title;
            }}
          ></button>
        </div>
      </div>`;
    } else if (this.input.type == 1) {
      return html` <div class="titlegrid">
        <div class="form-group">
          <label for="playlist-name">img</label>
          <input
            type="file"
            id="fileUpload"
            accept="image/*"
            @change=${(e) => {
              console.log(e.target.files);
              this.input.img = e.target.files[0];
            }}
          />
        </div>
        <div class="form-group">
          <label for="playlist-name">music</label>
          <input
            type="file"
            id="fileUpload"
            accept="audio/*"
            @change=${(e) => {
              console.log(e.target.files);
              this.input.file = e.target.files[0];
            }}
          />
        </div>
      </div>`;
    } else if (this.input.type == 2) {
      return html`
        <div class="form-group">
          <label for="playlist-name">Search</label>
          <div class="titlegrid">
            <input
              type="text"
              id="playlist-Url"
              name="playlist-Url"
              placeholder="Song Name(Youtube Search)"
              @change=${(e) => {
                this.input.search = e.target.value;
              }}
            /><button
              id="gettitle"
              @click=${async () => {
                this.search = await yt.Search(this.input.search);
                console.log(this.search);
                this.requestUpdate();
              }}
            ></button>
          </div>
          ${this.search != null && this.search.length > 0
            ? html`<div class="search">
                  ${this.search.map(
                    (e) => html`<div class="search-item">
                      <div class="search-item-img">
                        <img src="${e.img}" />
                      </div>
                      <div class="search-item-title">${e.title}</div>
                      <div class="search-item-button">
                        <button
                          @click=${() => {
                            this.type = 0;
                            this.input.name = e.title;
                            this.input.url =
                              "https://www.youtube.com/watch?v=" + e.id;

                            document.getElementById("playlist-name").value =
                              e.title;
                            document.getElementById("playlist-Url").value =
                              "https://www.youtube.com/watch?v=" + e.id;
                            this.search = null;
                          }}
                        ></button>
                      </div>
                    </div>`
                  )}
                </div>
                <style>
                  .search {
                    width: 100%;
                    height: 30vh;
                    overflow: auto;
                  }
                  .search-item {
                    display: grid;
                    grid-template-columns: 2fr 3fr 1fr;
                    grid-template-rows: 1fr;
                    grid-template-areas: "img title channel  button";
                    width: 100%;
                    height: 100px;
                    border-bottom: 1px solid #000;
                    margin-bottom: 10px;
                    border-radius: 1vh;
                  }
                  .search-item-img {
                    grid-area: img;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                  }
                  .search-item-img img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                  }
                  .search-item-title {
                    grid-area: title;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  }
                  .search-item-channel {
                    grid-area: channel;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  }
                  .search-item-button {
                    grid-area: button;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  }
                </style>`
            : html``}
        </div>
      `;
    }
  }
  modal() {
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && visibleModal != null) {
        this.closeModal(visibleModal);
      } else if (event.key === "Space" && visibleModal != null) {
        this.submit();
      }
    });
    return html`
      <dialog id="modal-add-playlist-song">
        <article>
          <a
            href="#close"
            aria-label="Close"
            class="close"
            data-target="modal-add-playlist-song"
            @click=${this.toggleModal}
          >
          </a>
          <h3>Playlist Add Song</h3>
          <form onsubmit="return false">
            <div class="grid">
              <fieldset>
                <legend>Song-type</legend>
                  <input
                    type="radio"
                    name="playlist-type"
                    @click=${() => {
                      this.input.type = 0;
                      this.requestUpdate();
                    }}
                    checked
                  />
                  Yotube
                </label>
                <label
                  ><input
                    type="radio"
                    name="playlist-type"
                    value="Yt_Playlist"
                    @click=${() => {
                      this.input.type = 1;
                      this.requestUpdate();
                    }}
                  />
                  file</label>
                <label
                  ><input
                    type="radio"
                    name="playlist-type"
                    value="Yt_Playlist"
                    @click=${() => {
                      this.input.type = 2;
                      this.requestUpdate();
                    }}
                  />
                  Search</label>
              </fieldset>
            </div>
            <div class="form-group">
              <label for="playlist-name">Name</label>
              <input
                type="text"
                id="playlist-name"
                name="playlist-name"
                placeholder="Song Name"
                @change=${(e) => {
                  console.log(e.target.value);
                  this.input.name = e.target.value;
                }}
              />
            </div>

            ${this.modal_add_song_input()}
          </form>
          <footer>
            <a
              href="#cancel"
              role="button"
              class="secondary"
              data-target="modal-add-playlist-song"
              @click=${this.toggleModal}
            >
              Cancel
            </a>
            <a
              href="#confirm"
              role="button"
              data-target="modal-add-playlist-song"
              @click=${async () => {
                if (this.input.type == 0) {
                  console.log(this.id, this.input.name, this.input.url);
                  if (
                    (await system.playlist.YtAdd(
                      this.id,
                      this.input.name,
                      this.input.url
                    )) != null
                  ) {
                    toastr.success("Create Success");
                    this.loading = false;
                    this.toggleModal();
                    this.requestUpdate();
                  } else {
                    toastr.error("Create Failed");
                  }
                } else {
                  console.log("file", this.input);
                  if (
                    system.playlist.FileAdd(
                      this.id,
                      this.input.name,
                      this.input.img,
                      this.input.file
                    ) != null
                  ) {
                    toastr.success("Create Success");
                    this.loading = false;
                    this.toggleModal();
                    this.requestUpdate();
                  } else {
                    toastr.error("Create Failed");
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
        .titlegrid {
          display: flex;
          align-items: center;
          gap: 1vh;
        }
        #gettitle {
          background-color: #4caf50; /* Green */
          width: 4vh;
          height: 4vh;
        }
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
              <th>
                <button @click=${this.toggleModal}>Add Song</button>
              </th>
              <th>
                <button
                  @click=${async () => {
                    console.log("start");
                    toastr.success("Save start");
                    await system.playlist.SaveSongs(this.playlist);
                    toastr.success("Save Success");
                  }}
                >
                  Save Playlist
                </button>
              </th>
            </tr>
          </table>
          <table>
            ${this.playlist != null &&
            this.playlist.Songs != null &&
            this.playlist.Songs.map((e, i) => {
              return html`<tr
                class=${this.player.play.index == i ? "active" : ""}
                @click=${() => {
                  console.log(e, i);
                  this.player.play.move(i);
                }}
              >
                <th><img src="${e.ImgUrl}" /></th>
                <th>${e.Name}</th>
                <th
                  class="delete"
                  @click=${async () => {
                    const d = confirm("정말로 삭제하시겠습니까?");
                    if (d) {
                      if (
                        (await system.playlist.DeleteSong(this.id, e.Id)) !=
                        null
                      ) {
                        this.loading = false;
                        toastr.success("Delete Success");
                        this.requestUpdate();
                      } else {
                        toastr.error("Delete Fail");
                      }
                    }
                    this.requestUpdate();
                  }}
                >
                  Delete
                </th>
              </tr>`;
            })}
          </table>
        </figure>
        ${this.player && this.player.render()}
      </main>
      <style>
        .active {
          background-color: #060a07;
        }
        figure {
          height: 80vh;
        }
        th {
          text-align: center;
          font-size: 3rem;
        }
        img {
          width: 10vw;
        }
      </style>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css"
      />
      ${this.modal()}
    `;
  }
}
customElements.define("playlist-page", playlist);
