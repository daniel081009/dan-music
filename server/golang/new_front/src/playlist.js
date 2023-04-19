import axios from "https://cdn.skypack.dev/axios";
import { serverurl } from "./env.js";
import file_db from "./db.js";

export default class Playlist {
  constructor() {
    this.Token = localStorage.getItem("token");
    this.db = new file_db();
  }
  /**
   *
   * @param {string} id 플레이리스트 아이디
   * @param {string} name 플레이리스트 이름
   * @param {file} img
   * @param {file} music
   * @returns {object|null} 실패시 null 리턴
   */
  async FileAdd(id, name, img, music) {
    let imgurl = "";
    let musicurl = "";
    console.log(id, name, img, music);
    if (img != null) {
      const imgdata = new FormData();
      imgdata.append("files", img);
      await fetch("/file/mp3upload", {
        method: "POST",
        body: imgdata,
      })
        .then(async (res) => {
          imgurl = await res.text();
        })
        .catch((e) => {
          console.log(e);
        });
    }
    console.log("img upload doned");
    if (music != null) {
      const musicdata = new FormData();
      musicdata.append("files", music);
      await fetch("/file/mp3upload", {
        method: "POST",
        body: musicdata,
      })
        .then(async (res) => {
          musicurl = await res.text();
        })
        .catch((e) => {
          console.log(e);
        });
    } else {
      return null;
    }
    console.log("music upload doned");
    try {
      console.log({
        token: localStorage.getItem("token"),
        playlistid: id,
        name: name,
        Songurl: musicurl,
        ImgUrl: imgurl,
      });
      const data = await axios({
        method: "post",
        url: serverurl + "/playlist/song/add",
        data: {
          token: localStorage.getItem("token"),
          playlistid: id,
          name: name,
          Songurl: musicurl,
          ImgUrl: imgurl,
        },
      });
      console.log(data, "song add done");
      return data.data;
    } catch (e) {
      return null;
    }
  }
  /**
   *
   * @param {string} playlistid 플레이리스트 아이디
   * @param {string} name 추가하고 싶은 곡 이름
   * @param {string} url 추가하고 싶은 곡 url
   * @returns {object|null} 실패시 null 리턴
   */
  async YtAdd(playlistid, name, url) {
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
      return data.data;
    } catch (e) {
      return null;
    }
  }
  /**
   * 플레이리스트에서 곡을 삭제하는 함곡
   * @param {string} playlistid 플레이리스트 아이디
   * @param {string} songid 곡 아이디
   * @returns {object|null} 실패시 null 리턴
   * @example
   * const data = await system.playlists.DeleteSong("플레이리스트 아이디", "곡 아이디");
   * if (data) {
   * console.log(data);
   * }
   */
  async DeleteSong(playlistid, songid) {
    try {
      const data = await axios({
        method: "delete",
        url: serverurl + "/playlist/song/delete",
        data: {
          token: this.Token,
          playlistid: playlistid,
          songid: songid,
        },
      });
      return data.data;
    } catch (e) {
      return null;
    }
  }
  /**
   * 플레이리스트에 있는 곡들을 저장하는 함수
   * @param {import("./playlists").Playlistty} playlist 플레이리스트
   * @returns {boolean} 실패시 false 리턴
   */
  async SaveSongs(playlist) {
    for (let i = 0; i < playlist.Songs.length; i++) {
      const element = playlist.Songs[i];
      console.log("downloading " + element.Path);
      try {
        this.db.set(
          element.Path,
          await fetch(element.Path, {}).then((resp) => resp.blob())
        );
        this.db.set(
          element.ImgUrl,
          await fetch(
            "https://cors.daoh.workers.dev/" + element.ImgUrl,
            {}
          ).then((resp) => resp.blob())
        );
      } catch (e) {
        console.log(e);
        continue;
      }
    }
    return true;
  }
}
