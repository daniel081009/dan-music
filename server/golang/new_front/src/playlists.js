import axios from "https://cdn.skypack.dev/axios";
import { serverurl } from "./env.js";
import Youtube from "./youtube.js";
// @ts-check
/**
 * 플레이리스트 객체
 * @typedef {object} Song
 * @property {string} Id 곡 아이디
 * @property {string} Name 곡 이름
 * @property {string} ImgUrl 곡 이미지 경로
 * @property {string} relimgurl 곡 이미지 경로(진짜)
 * @property {string} Path 곡 음악파일 경로
 */

/**
 * 플레이리스트 객체
 * @typedef {object} Playlistty
 * @property {string} Admin 플레이리스트 관리자 아이디
 * @property {string} Name 플레이리스트 이름
 * @property {boolean} Open 플레이리스트 공개 여부
 * @property {Song[]} Songs 플레이리스트 곡 목록
 */

export default class PlayLists {
  constructor() {
    this.PlayLists = {};
    this.Loaded = false;
    this.youtube = new Youtube();
  }
  /**
   * 플레이리스트를 가져오는 함수
   * @property {string} id 플레이리스트 아이디
   * @returns {Playlistty} 실패시 null 리턴
   */
  async GetPlaylist(id) {
    try {
      const data = await axios({
        method: "post",
        url: serverurl + "/playlist/get",
        data: {
          token: localStorage.getItem("token"),
          playlistid: id,
        },
      });
      console.log(data.data.playlist);
      return data.data.playlist;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  /**
   * 플레이리스트 목록을 가져오는 함수
   * @returns {Object.<string, Playlistty>} 실패시 null 리턴
   */
  async GetPlaylists() {
    if (this.Loaded) {
      return this.PlayLists;
    }
    try {
      const data = await axios({
        method: "post",
        url: serverurl + "/playlist/getall",
        data: {
          token: localStorage.getItem("token"),
        },
      });
      localStorage.setItem("playlists", JSON.stringify(data.data.playlists));
      this.PlayLists = data.data.playlists;
    } catch (e) {
      if (localStorage.getItem("playlists")) {
        this.PlayLists = JSON.parse(localStorage.getItem("playlists"));

        this.load = true;
        return this.PlayLists;
      }
      return null;
    }
    this.load = true;
    return this.PlayLists;
  }
  /**
   * 플레이리스트를 추가하는 함수
   * @param {string} name 플레이리스트 이름
   * @param {boolean} open 플레이리스트 공개 여부
   * @returns {boolean} 실패시 null 리턴
   * @example
   * const data = await system.playlists.AddPlaylist("플레이리스트 이름", true);
   * if (data) {
   *  console.log(data);
   * }
   * @example
   * const data = await system.playlists.AddPlaylist("플레이리스트 이름", false);
   * if (data) {
   * console.log(data);
   * }
   */
  async AddPlaylist(name, open) {
    try {
      const data = await axios({
        method: "post",
        url: serverurl + "/playlist/create",
        data: {
          token: localStorage.getItem("token"),
          name: name,
          open: open,
        },
      });
      this.load = false;
      return data;
    } catch (e) {
      console.error(e);
      return null;
    }
  }
  /**
   * 플레이리스트를 삭제하는 함수
   * @param {string} id 플레이리스트 아이디
   * @returns {object|null} 실패시 null 리턴
   * @example
   * const data = await system.playlists.DeletePlaylist("플레이리스트 아이디");
   * if (data) {
   * console.log(data);
   * }
   */
  async DeletePlaylist(id) {
    try {
      const data = await axios({
        method: "delete",
        url: serverurl + "/playlist/delete",
        data: {
          token: localStorage.getItem("token"),
          playlistid: id,
        },
      });
      this.load = false;
      return data;
    } catch (e) {
      console.error(e);
      return null;
    }
  }
  /**
   * 유튜브 플레이리스트를 추가하는 함수
   * @param {string} name 플레이리스트 이름
   * @param {boolean} open 플레이리스트 공개 여부
   * @param {string} url 유튜브 플레이리스트 url
   * @returns {boolean} 실패시 false 리턴
   */
  async ytplaylistcopy(name, open, url) {
    const d = this.youtube.extractPlaylistId(url);
    if (d == null) {
      return false;
    }
    let create = await this.AddPlaylist(name, open);
    console.log(create, "cre", create.data.id);
    if (create == null) {
      return false;
    }
    let data = await this.youtube.playlist(d);
    if (data == null) {
      return false;
    }
    for (let i = 0; i < data.length; i++) {
      console.log(`${i + 1}/${data.length} - ${data[i].title} add`);
      await this.YtAddSong(
        create.data.id,
        data[i].title,
        "https://www.youtube.com/watch?v=" + data[i].id
      );
    }
    return true;
  }
  async YtAddSong(playlistid, name, url) {
    try {
      let datad = await axios({
        url: serverurl + "/file/mp3/" + url.split("/")[3],
        method: "GET",
      });
      const data = await axios({
        method: "post",
        url: serverurl + "/playlist/song/add",
        data: {
          token: localStorage.getItem("token"),
          playlistid: playlistid,
          name: name,
          Songurl: datad.data,
          ImgUrl: `https://i.ytimg.com/vi/${
            datad.data.split("/")[4].split(".")[0]
          }/hqdefault.jpg`,
        },
      });
      console.log(data, datad);
      this.load = false;
      return data.data;
    } catch (e) {
      return null;
    }
  }
}
