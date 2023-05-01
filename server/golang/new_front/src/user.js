import axios from "https://cdn.skypack.dev/axios";
import { serverurl } from "./env.js";
export default class User {
  /**
   * 토큰 유효성 검사
   * @returns {string|boolean} 로그인 여부 로그인시 유저 이름 리인 로그인 안되어있을시 false 리턴
   */
  async checkToken() {
    if (localStorage.getItem("token")) {
      try {
        const data = await axios({
          method: "post",
          url: serverurl + "/user/info",
          data: {
            token: localStorage.getItem("token"),
          },
        });
        localStorage.setItem("check", JSON.stringify(data.data));
        if (data.data["message"] != "success!") {
          return false;
        }
        return data.data["user"].UserName;
      } catch (e) {
        if (localStorage.getItem("check")) {
          return JSON.parse(localStorage.getItem("check"))["user"].UserName;
        }
        console.log(e);
        return false;
      }
    } else {
      return false;
    }
  }

  /**
   *
   * @param {string} username
   * @param {string} password
   * @returns {string|boolean} 성공시 token 실패시 false
   */
  async Login(username, password) {
    try {
      const data = await axios({
        method: "post",
        url: serverurl + "/user/login",
        data: {
          username: username,
          password: password,
        },
      });
      return data.data.token;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
  /**
   *
   * @param {string} username
   * @param {string} password
   * @returns {boolean} 성공시 true 실패시 false
   */
  async Register(username, password) {
    try {
      await axios({
        method: "post",
        url: serverurl + "/user/register",
        data: {
          username: username,
          password: password,
        },
      });
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
  async Logout() {
    localStorage.removeItem("token");
  }
}
