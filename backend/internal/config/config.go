package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                string
	MongoURI            string
	MongoDBName         string
	CloudinaryCloudName string
	CloudinaryAPIKey    string
	CloudinaryAPISecret string
	CloudinaryURL       string
	CORSAllowOrigins    string
}

func LoadConfig() *Config {
	// Try loading .env from current directory or parent directory
	if err := godotenv.Load(); err != nil {
		_ = godotenv.Load("../../.env")
	}

	cfg := &Config{
		Port:                getEnv("PORT", "8080"),
		MongoURI:            getEnv("MONGODB_URI", "mongodb://localhost:27017"),
		MongoDBName:         getEnv("MONGODB_DB_NAME", "small_victory"),
		CloudinaryCloudName: getEnv("CLOUDINARY_CLOUD_NAME", ""),
		CloudinaryAPIKey:    getEnv("CLOUDINARY_API_KEY", ""),
		CloudinaryAPISecret: getEnv("CLOUDINARY_API_SECRET", ""),
		CloudinaryURL:       getEnv("CLOUDINARY_URL", ""),
		CORSAllowOrigins:    getEnv("CORS_ALLOW_ORIGINS", "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000"),
	}

	log.Printf("[Config] Running with Port: %s, MongoDB: %s/%s", cfg.Port, cfg.MongoURI, cfg.MongoDBName)
	return cfg
}

func getEnv(key, defaultVal string) string {
	val := os.Getenv(key)
	if val == "" {
		return defaultVal
	}
	return val
}
