import file_db from "./db.js";
import PlayLists from "./playlists.js";
import Playlist from "./playlist.js";
import User from "./user.js";
import Play from "./play.js";
// @ts-check

export default class System {
  constructor() {
    this.db = new file_db();
    this.user = new User();
    this.playlists = new PlayLists();
    this.playlist = new Playlist();
    /**
     * @type {Play}
     */
    this.play = null;
  }
}
