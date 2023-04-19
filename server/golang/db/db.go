package db

import (
	"dan-music/util"
	"fmt"

	"github.com/boltdb/bolt"
)

const (
	DB_NAME         = "main.db"
	USER_BUCKET     = "user"
	Playlist_BUCKET = "playlist"
)

type User struct {
	Username string
	Password string
	Playlist []string // playlist id
}
type Playlist struct {
	Name  string
	Songs []Song
	Open  bool
	Admin string
}
type Song struct {
	Id     string
	Name   string
	ImgUrl string
	Path   string // python server path
}

var db *bolt.DB

func Conn() *bolt.DB {
	if db != nil {
		return db
	}
	conn, err := bolt.Open(DB_NAME, 0600, nil)
	if err != nil {
		panic(err)
	}
	db = conn
	return conn
}

func RegisterUser(username string, password string) error {
	conn := Conn()
	// defer conn.Close()
	return conn.Update(func(tx *bolt.Tx) error {
		bucket, err := tx.CreateBucketIfNotExists([]byte(USER_BUCKET))
		if err != nil {
			return err
		}

		value := bucket.Get([]byte(username))
		if value != nil {
			return fmt.Errorf("user already exists")
		}

		u := User{Username: username, Password: password, Playlist: []string{}}

		return bucket.Put([]byte(username), util.StructtoByte(u))
	})
}
func LoginUser(username string, password string) error {
	conn := Conn()

	err := conn.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(USER_BUCKET))
		if bucket.Get([]byte(username)) == nil {
			return fmt.Errorf("user not exists")
		}
		u := User{}
		util.BytetoStruct(bucket.Get([]byte(username)), &u)
		if u.Password != password {
			return fmt.Errorf("password error")
		}
		return nil
	})
	return err
}

func GetAllPlaylist(username string) (map[string]Playlist, error) {
	conn := Conn()
	// defer conn.Close()

	Playlist_res := map[string]Playlist{}
	userpl := []string{}
	err := conn.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(USER_BUCKET))
		if bucket.Get([]byte(username)) == nil {
			return fmt.Errorf("user not exists")
		}
		u := User{}
		util.BytetoStruct(bucket.Get([]byte(username)), &u)
		userpl = u.Playlist
		return nil
	})

	for _, id := range userpl {
		pl, err := GetPlaylist(id)
		if err != nil {
			if err.Error() == "playlist not exists" {
				conn.Update(func(tx *bolt.Tx) error {
					bucket, err := tx.CreateBucketIfNotExists([]byte(USER_BUCKET))
					if err != nil {
						return err
					}
					u := User{}
					util.BytetoStruct(bucket.Get([]byte(username)), &u)
					for i, v := range u.Playlist {
						if v == id {
							u.Playlist = append(u.Playlist[:i], u.Playlist[i+1:]...)
						}
					}
					err = bucket.Put([]byte(username), util.StructtoByte(u))
					return err
				})
			}
			fmt.Println(err)
			continue
		}
		Playlist_res[id] = pl
	}
	return Playlist_res, err
}

func GetPlaylist(id string) (Playlist, error) {
	conn := Conn()
	// defer conn.Close()

	pl := Playlist{}
	e := conn.Update(func(tx *bolt.Tx) error {
		bucket, err := tx.CreateBucketIfNotExists([]byte(Playlist_BUCKET))
		if err != nil {
			return err
		}

		if bucket.Get([]byte(id)) == nil {
			return fmt.Errorf("playlist not exists")
		}
		err = util.BytetoStruct(bucket.Get([]byte(id)), &pl)
		return err
	})
	return pl, e
}

func CreatePlaylist(name string, open bool, admin string) (string, error) {
	conn := Conn()
	// defer conn.Close()
	if name == "" {
		return "", fmt.Errorf("name can not be empty")
	}

	id := util.RandString(10)
	if conn.Update(func(tx *bolt.Tx) error {
		bucket, err := tx.CreateBucketIfNotExists([]byte(Playlist_BUCKET))
		if err != nil {
			return err
		}

		value := bucket.Get([]byte(id))
		if value != nil {
			return fmt.Errorf("user already exists")
		}

		pl := Playlist{Name: name, Songs: []Song{}, Open: open, Admin: admin}
		err = bucket.Put([]byte(id), util.StructtoByte(pl))
		return err
	}) != nil {
		return "", fmt.Errorf("create playlist failed")
	}
	if conn.Update(func(tx *bolt.Tx) error {
		bucket, err := tx.CreateBucketIfNotExists([]byte(USER_BUCKET))
		if err != nil {
			return err
		}
		u := User{}
		util.BytetoStruct(bucket.Get([]byte(admin)), &u)
		u.Playlist = append(u.Playlist, id)
		err = bucket.Put([]byte(admin), util.StructtoByte(u))
		return err
	}) != nil {
		return "", fmt.Errorf("create playlist failed")
	}
	return id, nil
}
func EditPlaylist(id string, pl Playlist) error {
	conn := Conn()
	// defer conn.Close()
	return conn.Update(func(tx *bolt.Tx) error {
		bucket, err := tx.CreateBucketIfNotExists([]byte(Playlist_BUCKET))
		if err != nil {
			return err
		}
		err = bucket.Put([]byte(id), util.StructtoByte(pl))
		return err
	})
}

func DeletePlaylist(id string) error {
	conn := Conn()
	// defer conn.Close()
	return conn.Update(func(tx *bolt.Tx) error {
		bucket, err := tx.CreateBucketIfNotExists([]byte(Playlist_BUCKET))
		if err != nil {
			return err
		}
		err = bucket.Delete([]byte(id))
		return err
	})
}
func CheckAdmin(id string, admin string) bool {
	conn := Conn()
	// defer conn.Close()
	ok := false
	conn.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(Playlist_BUCKET))
		if bucket == nil {
			return nil
		}
		pl := Playlist{}
		util.BytetoStruct(bucket.Get([]byte(id)), &pl)
		if pl.Admin == admin {
			ok = true
		}
		return nil
	})
	return ok
}

func AddSongToPlaylist(id string, song Song) error {
	conn := Conn()
	// defer conn.Close()
	return conn.Update(func(tx *bolt.Tx) error {
		bucket, err := tx.CreateBucketIfNotExists([]byte(Playlist_BUCKET))
		if err != nil {
			return err
		}
		pl := Playlist{}
		util.BytetoStruct(bucket.Get([]byte(id)), &pl)
		song.Id = util.RandString(10)
		pl.Songs = append(pl.Songs, song)
		err = bucket.Put([]byte(id), util.StructtoByte(pl))
		return err
	})
}
func EditSongFromPlaylist(id string, orsong Song, chsong Song) {
	conn := Conn()
	// defer conn.Close()
	conn.Update(func(tx *bolt.Tx) error {
		bucket, err := tx.CreateBucketIfNotExists([]byte(Playlist_BUCKET))
		if err != nil {
			return err
		}
		pl := Playlist{}
		util.BytetoStruct(bucket.Get([]byte(id)), &pl)
		for i, s := range pl.Songs {
			if s.Name == orsong.Name {
				pl.Songs[i] = chsong
				break
			}
		}
		err = bucket.Put([]byte(id), util.StructtoByte(pl))
		return err
	})
}
func MoveSongFromPlaylist(id string, songid string, index int) error {
	conn := Conn()
	// defer conn.Close()
	return conn.Update(func(tx *bolt.Tx) error {
		bucket, err := tx.CreateBucketIfNotExists([]byte(Playlist_BUCKET))
		if err != nil {
			return err
		}
		pl := Playlist{}
		util.BytetoStruct(bucket.Get([]byte(id)), &pl)
		if index > len(pl.Songs) {
			index = len(pl.Songs)
		}
		for i, s := range pl.Songs {
			if s.Id == songid {
				pl.Songs = append(pl.Songs[:i], pl.Songs[i+1:]...)
				break
			}
		}
		pl.Songs = append(pl.Songs[:index], append([]Song{pl.Songs[index]}, pl.Songs[index:]...)...)
		err = bucket.Put([]byte(id), util.StructtoByte(pl))
		return err
	})
}
func RemoveSongFromPlaylist(id string, songid string) error {
	conn := Conn()
	// defer conn.Close()
	return conn.Update(func(tx *bolt.Tx) error {
		bucket, err := tx.CreateBucketIfNotExists([]byte(Playlist_BUCKET))
		if err != nil {
			return err
		}
		pl := Playlist{}
		util.BytetoStruct(bucket.Get([]byte(id)), &pl)
		for i, s := range pl.Songs {
			if s.Id == songid {
				pl.Songs = append(pl.Songs[:i], pl.Songs[i+1:]...)
				break
			}
		}
		err = bucket.Put([]byte(id), util.StructtoByte(pl))
		return err
	})
}
