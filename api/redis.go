package main

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/go-redis/redis/v8"
)

// Redis客户端
var rdb *redis.Client

// 初始化Redis连接
func initRedisClient() {
	addr := os.Getenv("REDIS_ADDR")
	if addr == "" {
		addr = "localhost:6379"
	}

	password := os.Getenv("REDIS_PASSWORD")

	rdb = redis.NewClient(&redis.Options{
		Addr:         addr,
		Password:     password,
		DB:           0,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
		PoolSize:     10,
		MinIdleConns: 5,
	})

	// 测试连接
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Printf("Redis connection failed: %v", err)
		rdb = nil
	} else {
		log.Println("Redis connected successfully")
	}
}

// 缓存百度AI access token
func cacheBaiduAccessToken(token string, expiresIn int) error {
	if rdb == nil {
		return nil // Redis未连接时不缓存
	}

	ctx := context.Background()
	return rdb.Set(ctx, "baidu_access_token", token, time.Duration(expiresIn-300)*time.Second).Err()
}

// 获取缓存的百度AI access token
func getCachedBaiduAccessToken() (string, error) {
	if rdb == nil {
		return "", nil // Return empty string instead of error to allow fallback
	}

	ctx := context.Background()
	token, err := rdb.Get(ctx, "baidu_access_token").Result()
	if err == redis.Nil {
		return "", nil // Token not found, not an error
	}
	return token, err
}