package util

import (
	"bytes"
	"encoding/gob"
	"log"
	"math/rand"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
)

var letterRunes = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

func Error(c *gin.Context, code int, message string) {
	c.AbortWithStatusJSON(code, gin.H{
		"message": message,
	})
}
func BindJSON(c *gin.Context, obj interface{}) error {
	if err := binding.JSON.Bind(c.Request, obj); err != nil {
		c.Error(err).SetType(gin.ErrorTypeBind)
		return err
	}
	return nil
}
func RandString(n int) string {
	rand.Seed(time.Now().UnixNano())
	b := make([]rune, n)
	for i := range b {
		b[i] = letterRunes[rand.Intn(len(letterRunes))]
	}
	return string(b)
}

func StructtoByte(u interface{}) []byte {
	buf := bytes.Buffer{}
	enc := gob.NewEncoder(&buf)
	err := enc.Encode(u)
	if err != nil {
		log.Fatal("encode error:", err)
	}
	return buf.Bytes()
}
func BytetoStruct(Byte []byte, obj any) error {
	dec := gob.NewDecoder(bytes.NewReader(Byte))
	err := dec.Decode(obj)
	if err != nil {
		return err
	}
	return nil
}
