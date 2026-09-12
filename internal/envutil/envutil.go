package envutil

import (
	"log"

	"github.com/allisson/go-env"
)

func GetRequired(key string) string {
	val := env.GetString(key, "")
	if val == "" {
		log.Fatalf("missing required environment variable: %s", key)
	}

	return val
}
