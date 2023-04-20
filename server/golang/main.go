package main

import (
	"dan-music/db"
	"dan-music/jwt"
	"dan-music/util"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"

	"github.com/gin-contrib/static"
	"github.com/gin-gonic/autotls"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/acme/autocert"
)

func proxy(c *gin.Context) {
	remote, err := url.Parse("http://127.0.0.1:5001")
	if err != nil {
		panic(err)
	}

	proxy := httputil.NewSingleHostReverseProxy(remote)
	proxy.Director = func(req *http.Request) {
		req.Header = c.Request.Header
		req.Host = remote.Host
		req.URL.Scheme = remote.Scheme
		req.URL.Host = remote.Host
		req.URL.Path = c.Param("proxyPath")
	}

	proxy.ServeHTTP(c.Writer, c.Request)
}
func main() {
	r := gin.Default()

	// r.Use(func(c *gin.Context) {
	// 	c.Writer.Header().Set("Access-Control-Allow-Origin", "music.daoh.dev:5001, kit.fontawesome.com")
	// 	c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")
	// 	c.Writer.Header().Set("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers")
	// 	c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
	// 	if c.Request.Method == "OPTIONS" {
	// 		c.AbortWithStatus(204)
	// 		return
	// 	}
	// 	c.Next()
	// })
	r.Use(static.Serve("/src", static.LocalFile("./new_front/src", false)))

	user := r.Group("/user")
	user.POST("/login", func(c *gin.Context) {
		type req struct {
			Username string `json:"username" binding:"required"`
			Password string `json:"password" binding:"required"`
		}
		var data req
		util.BindJSON(c, &data)
		err := db.LoginUser(data.Username, data.Password)
		if err == nil {
			token, err := jwt.GetJwtToken(data.Username)
			if err != nil {
				util.Error(c, 403, "token err!")
				return
			}
			c.JSON(200, gin.H{
				"message": "success!",
				"token":   token,
			})
			return
		}
		c.JSON(403, gin.H{
			"message": "failed!",
		})
	})
	user.POST("/register", func(c *gin.Context) {
		type req struct {
			Username string `json:"username" binding:"required"`
			Password string `json:"password" binding:"required"`
		}
		var data req
		util.BindJSON(c, &data)

		fmt.Println(data)
		err := db.RegisterUser(data.Username, data.Password)
		fmt.Println(err)
		if err == nil {
			token, err := jwt.GetJwtToken(data.Username)
			if err != nil {
				util.Error(c, 403, "token err!")
			}
			c.JSON(200, gin.H{
				"message": "success!",
				"token":   token,
			})
		} else {
			util.Error(c, 403, "failed!")
		}
	})
	user.POST("/info", func(c *gin.Context) {
		type req struct {
			Token string `json:"token" binding:"required"`
		}
		var data req
		util.BindJSON(c, &data)
		user, err := jwt.ParseJwtToken(data.Token)
		if err != nil {
			util.Error(c, 403, "token err!")
			return
		}
		c.JSON(200, gin.H{
			"message": "success!",
			"user":    user,
		})
	})
	playlist := r.Group("/playlist")
	playlist.POST("/get", func(c *gin.Context) {
		type req struct {
			Playlistid string `json:"playlistid" binding:"required"`
			Token      string `json:"token" binding:"required"`
		}
		var data req
		util.BindJSON(c, &data)
		user, err := jwt.ParseJwtToken(data.Token)
		if err != nil {
			util.Error(c, 403, "token err!")
			return
		}
		pl, err := db.GetPlaylist(data.Playlistid)

		if err == nil && (pl.Open || pl.Admin == user.UserName) {
			c.JSON(200, gin.H{
				"message":  "success!",
				"playlist": pl,
			})
		} else {
			util.Error(c, 403, "no permission!")
		}
	})
	playlist.POST("/getall", func(c *gin.Context) {
		type req struct {
			Token string `json:"token" binding:"required"`
		}
		var data req
		util.BindJSON(c, &data)
		user, err := jwt.ParseJwtToken(data.Token)
		if err != nil {
			util.Error(c, 403, "token err!")
			return
		}
		pll, err := db.GetAllPlaylist(user.UserName)
		if err == nil {
			c.JSON(200, gin.H{
				"message":   "success!",
				"playlists": pll,
			})
		} else {
			util.Error(c, 403, "failed!")
		}
	})
	playlist.POST("/create", func(c *gin.Context) {
		type req struct {
			Name  string `json:"name" binding:"required"`
			Open  bool   `json:"open" binding:"required"`
			Token string `json:"token" binding:"required"`
		}
		var data req
		util.BindJSON(c, &data)
		user, err := jwt.ParseJwtToken(data.Token)
		if err != nil {
			util.Error(c, 403, "token err!")
			return
		}
		playlistid, err := db.CreatePlaylist(data.Name, data.Open, user.UserName)
		if err == nil {
			c.JSON(200, gin.H{
				"message": "success!",
				"id":      playlistid,
			})
		} else {
			util.Error(c, 403, "failed!")
		}
	})
	playlist.PATCH("/edit", func(c *gin.Context) {
		type req struct {
			Playlistid string `json:"playlistid" binding:"required"`
			Name       string `json:"name" binding:"required"`
			Open       bool   `json:"open" binding:"required"`
			Token      string `json:"token" binding:"required"`
		}
		var data req
		util.BindJSON(c, &data)
		user, err := jwt.ParseJwtToken(data.Token)
		if err != nil {
			util.Error(c, 403, "token err!")
			return
		}
		if db.EditPlaylist(data.Playlistid, db.Playlist{Name: data.Name, Open: data.Open, Admin: user.UserName}) == nil {
			c.JSON(200, gin.H{
				"message": "success!",
			})
		} else {
			util.Error(c, 403, "failed!")
		}
	})
	playlist.DELETE("/delete", func(c *gin.Context) {
		type req struct {
			Playlistid string `json:"playlistid" binding:"required"`
			Token      string `json:"token" binding:"required"`
		}
		var data req
		util.BindJSON(c, &data)
		token, err := jwt.ParseJwtToken(data.Token)
		if err != nil {
			util.Error(c, 403, "token err!")
			return
		}
		if !db.CheckAdmin(data.Playlistid, token.UserName) {
			util.Error(c, 403, "not admin!")
			return
		}
		if db.DeletePlaylist(data.Playlistid) == nil {
			c.JSON(200, gin.H{
				"message": "success!",
			})
		} else {
			util.Error(c, 403, "failed!")
		}
	})
	song := playlist.Group("/song")
	song.POST("/add", func(c *gin.Context) {
		type req struct {
			Playlistid string `json:"playlistid" binding:"required"`
			Imgurl     string `json:"imgurl" binding:"required"`
			Songurl    string `json:"songurl" binding:"required"`
			Name       string `json:"name" binding:"required"`
			Token      string `json:"token" binding:"required"`
		}
		var data req
		util.BindJSON(c, &data)
		user, err := jwt.ParseJwtToken(data.Token)
		if err != nil {
			util.Error(c, 403, "token err!")
			return
		}
		if !db.CheckAdmin(data.Playlistid, user.UserName) {
			util.Error(c, 403, "not admin!")
			return
		}
		if db.AddSongToPlaylist(data.Playlistid, db.Song{Name: data.Name, ImgUrl: data.Imgurl, Path: data.Songurl}) != nil {
			util.Error(c, 403, "failed!")
			return
		} else {
			c.JSON(200, gin.H{
				"message": "success!",
			})
		}
	})
	song.POST("/move", func(c *gin.Context) {
		type req struct {
			Playlistid string `json:"playlistid" binding:"required"`
			Songid     string `json:"songid" binding:"required"`
			Index      int    `json:"index" binding:"required"`
			Token      string `json:"token" binding:"required"`
		}
		var data req
		util.BindJSON(c, &data)
		user, err := jwt.ParseJwtToken(data.Token)
		if err != nil {
			util.Error(c, 403, "token err!")
			return
		}
		if !db.CheckAdmin(data.Playlistid, user.UserName) {
			util.Error(c, 403, "not admin!")
			return
		}
		db.MoveSongFromPlaylist(data.Playlistid, data.Songid, data.Index)
		c.JSON(200, gin.H{
			"message": "success!",
		})
	})
	song.DELETE("/delete", func(c *gin.Context) {
		type req struct {
			Playlistid string `json:"playlistid" binding:"required"`
			Songid     string `json:"songid" binding:"required"`
			Token      string `json:"token" binding:"required"`
		}
		var data req
		util.BindJSON(c, &data)
		user, err := jwt.ParseJwtToken(data.Token)
		if err != nil {
			util.Error(c, 403, "token err!")
			return
		}
		if !db.CheckAdmin(data.Playlistid, user.UserName) {
			util.Error(c, 403, "not admin!")
			return
		}
		db.RemoveSongFromPlaylist(data.Playlistid, data.Songid)
		c.JSON(200, gin.H{
			"message": "success!",
		})
	})

	// r.Use(static.Serve("/file", static.LocalFile("../python/mp3", false)))
	r.Any("/file/*proxyPath", proxy)
	r.Use(func(ctx *gin.Context) {
		//send index.html for all routes
		ctx.File("./new_front/index.html")
	})

	dev := 1
	if dev == 1 {
		r.Run(":80")
	} else {
		gin.SetMode(gin.ReleaseMode)
		m := autocert.Manager{
			Prompt:     autocert.AcceptTOS,
			HostPolicy: autocert.HostWhitelist("music.daoh.dev"),
			Cache:      autocert.DirCache("./ssl"),
		}

		log.Fatal(autotls.RunWithManager(r, &m))
	}
}
