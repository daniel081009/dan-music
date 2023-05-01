import file_db from "./db.js";

export default class play {
  /**
   * @param {import("./playlists.js").Song[]} songs
   */
  constructor(songs, update) {
    this.db = new file_db();
    this.songs = songs;
    this.audio = new Audio();
    this.index = 0;
    this.playbool = false;
    this.progress = 0;
    this.update = update;
    this.oneloop = false;
    this.playsong = false;
    this.audio.addEventListener("timeupdate", (e) => {
      const { duration, currentTime } = e.srcElement;
      this.progress = (currentTime / duration) * 100;
      update();
    });

    this.setmediaSession();
    (async () => {
      for (let i = 0; i < this.songs.length; i++) {
        let url = "";
        try {
          this.songs[i].relimgurl = URL.createObjectURL(
            await this.db.get(this.songs[i].ImgUrl)
          );
        } catch (error) {
          this.songs[i].relimgurl = this.songs[i].ImgUrl;
        }
        this.songs[i].mi = new MediaMetadata({
          title: this.songs[i].Name,
          album: "Dan-Music",
          artwork: [
            {
              src: url,
              sizes: "96x96",
              type: "image/jpg",
            },
          ],
        });

        let temp = await this.db.get(this.songs[i].Path);
        try {
          this.songs[i].relurl = URL.createObjectURL(temp);
        } catch (error) {
          this.songs[i].relurl = this.songs[i].Path;
        }
      }
    })();
    console.log(this.songs);
  }
  updatePositionState() {
    if ("setPositionState" in navigator.mediaSession) {
      navigator.mediaSession.setPositionState({
        duration: this.audio.duration,
        playbackRate: this.audio.playbackRate,
        position: this.audio.currentTime,
      });
    }
  }
  async updateMetadata() {
    console.log("update", this.songs[this.index].mi);
    navigator.mediaSession.metadata = this.songs[this.index].mi;
    this.updatePositionState();
  }
  random() {
    this.index = 0;
    this.songs.sort(() => Math.random() - 0.5);
    this.play();
  }
  setmediaSession() {
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      this.prev();
    });

    navigator.mediaSession.setActionHandler("nexttrack", () => {
      this.next();
    });

    this.audio.addEventListener("ended", () => {
      this.playsong = false;
      if (this.oneloop) {
        this.audio.currentTime = 0;
        this.play();
        return;
      }
      this.next();
    });

    let defaultSkipTime = 10;

    navigator.mediaSession.setActionHandler("seekbackward", (event) => {
      const skipTime = event.seekOffset || defaultSkipTime;
      this.audio.currentTime = Math.max(this.audio.currentTime - skipTime, 0);
      this.updatePositionState();
    });

    navigator.mediaSession.setActionHandler("seekforward", (event) => {
      const skipTime = event.seekOffset || defaultSkipTime;
      this.audio.currentTime = Math.min(
        this.audio.currentTime + skipTime,
        this.audio.duration
      );
      this.updatePositionState();
    });

    navigator.mediaSession.setActionHandler("play", async () => {
      await this.play();
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      this.stop();
    });

    try {
      navigator.mediaSession.setActionHandler("stop", () => {
        this.stop();
      });
    } catch (error) {}
  }
  async play() {
    if (this.playsong) {
      this.audio.play();
      return;
    }
    console.log("play", this.songs[this.index].relurl, this.index);
    this.audio.src = this.songs[this.index].relurl;
    console.log(this.audio.src);
    this.audio
      .play()
      .then(() => {
        console.log("playing", this.audio.src);
        this.updateMetadata();
        navigator.mediaSession.playbackState = "playing";
      })
      .catch((error) => {
        console.log(error);
        this.next();
      });
    this.playbool = true;
    this.playsong = true;
  }
  async toggle() {
    if (this.playbool) {
      this.stop();
      this.playbool = false;
    } else {
      this.play();
      this.playbool = true;
    }
  }
  async move(index) {
    this.playsong = false;
    this.index = index;
    this.play();
  }
  async stop() {
    navigator.mediaSession.playbackState = "paused";
    this.playbool = false;
    return this.audio.pause();
  }
  async next() {
    this.index++;
    if (this.index >= this.songs.length) {
      this.index = 0;
    }
    this.playsong = false;
    this.play();
  }
  async prev() {
    this.index--;
    if (this.index < 0) {
      this.index = this.songs.length - 1;
    }
    this.playsong = false;
    this.play();
  }
}
