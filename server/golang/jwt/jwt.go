package jwt

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

type Claims struct {
	UserName string
	jwt.StandardClaims
}

var expirationTime = time.Minute * 60 * 24 * 7

var JwtKey = []byte("DanMusic!@#$")

func GetJwtToken(UserName string) (string, error) {
	expirationTime := time.Now().Add(expirationTime)
	claims := &Claims{
		UserName: UserName,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(JwtKey)
	if err != nil {
		return "", fmt.Errorf("token signed Error")
	} else {
		return tokenString, nil
	}
}
func ParseJwtToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return JwtKey, nil
	})
	if err != nil {
		return nil, fmt.Errorf("token parse Error")
	}
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	} else {
		return nil, fmt.Errorf("token parse Error")
	}
}
