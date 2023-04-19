export default class youtube {
  constructor() {
    gapi.client.setApiKey("AIzaSyB74QfV7xwi8zxVD5J_-wIy56X8ef6fUTc");
    gapi.client.load("youtube", "v3");
  }
  extractPlaylistId(url) {
    const regex = /list=([\w-]+)/;
    const match = url.match(regex);
    if (match) {
      return match[1];
    }
    return null;
  }
  extractVideoId(url) {
    const regex = /v=([\w-]+)/;
    const match = url.match(regex);
    if (match) {
      return match[1];
    }
    return null;
  }
  /**
   * @param {string} id
   * @returns {string|null} video title or null
   */
  async getvideo(id) {
    let title = "";
    try {
      await gapi.client
        .request({
          path: "youtube/v3/videos",
          params: {
            id: id,
            part: "snippet",
          },
        })
        .then(function (response) {
          title = JSON.parse(response.body).items[0].snippet.title;
        });
    } catch (e) {
      console.log(e);
      return null;
    }
    return title;
  }
  async playlist(playlistid) {
    let playlist = [];
    try {
      await gapi.client
        .request({
          path: "youtube/v3/playlistItems",
          params: {
            playlistId: playlistid,
            part: "snippet",
            fields: "items(snippet(title,resourceId(videoId)))",
            maxResults: 50,
          },
        })
        .then(function (response) {
          response.result.items.forEach(function (item) {
            playlist.push({
              title: item.snippet.title,
              id: item.snippet.resourceId.videoId,
            });
          });
        });
      return playlist;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  /**
   * @param {string} query
   * @returns {object[]|null} video object or null
   */
  async Search(query) {
    let result = [];
    try {
      await gapi.client
        .request({
          path: "youtube/v3/search",
          params: {
            q: query,
            part: "snippet",
            maxResults: 10,
          },
        })
        .then(function (response) {
          response.result.items.forEach(function (item) {
            result.push({
              title: item.snippet.title,
              id: item.id.videoId,
              img: item.snippet.thumbnails.medium.url,
              channel: item.snippet.channelTitle,
            });
          });
        });
      return result;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
