package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	sqlite "github.com/glebarez/sqlite"
	"github.com/go-redis/redis/v8"
	"github.com/joho/godotenv"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var (
	db *gorm.DB
)

func main() {
    // 加载环境变量
    _ = godotenv.Load(".env.local")
    if err := godotenv.Load(); err != nil {
        log.Println("Warning: .env file not found")
    }

	// 初始化数据库
	initDB()

	// 初始化Redis
	initRedis()

	// 设置Gin模式
	if os.Getenv("APP_ENV") == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 创建路由
	router := setupRouter()

	// 启动服务器
	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}

	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func initDB() {
	driver := os.Getenv("DB_DRIVER")
	dsn := os.Getenv("DB_DSN")

	var err error
	if driver == "sqlite" {
		db, err = gorm.Open(sqlite.Open("image.db"), &gorm.Config{})
	} else {
		if dsn == "" {
			host := os.Getenv("DB_HOST")
			port := os.Getenv("DB_PORT")
			user := os.Getenv("DB_USER")
			pass := os.Getenv("DB_PASSWORD")
			name := os.Getenv("DB_NAME")
			if host == "" {
				host = "127.0.0.1"
			}
			if port == "" {
				port = "3306"
			}
			if user == "" {
				user = "root"
			}
			if name == "" {
				name = "image_recognition"
			}
			dsn = fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local", user, pass, host, port, name)
		}
		db, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	}
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// 自动迁移表结构
	if err := db.AutoMigrate(&User{}, &RecognitionRecord{}); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}
}

func initRedis() {
	rdb = redis.NewClient(&redis.Options{
		Addr:     os.Getenv("REDIS_HOST") + ":" + os.Getenv("REDIS_PORT"),
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       0,
	})

	if err := rdb.Ping(context.Background()).Err(); err != nil {
		log.Println("Warning: Redis connection failed", err)
		rdb = nil // 设置为nil，后续代码会处理
	}
}

func setupRouter() *gin.Engine {
    router := gin.Default()

    // CORS配置
    router.Use(corsMiddleware())

    // 静态资源：上传图片
    router.Static("/uploads", "./uploads")

    // 健康检查
    router.GET("/health", func(c *gin.Context) {
        c.JSON(200, gin.H{"status": "ok"})
    })

	// API路由组
	api := router.Group("/api")
	{
		// 用户相关
		api.POST("/auth/login", loginHandler)
		api.POST("/auth/register", registerHandler)

		// 需要认证的路由
		auth := api.Group("/")
		auth.Use(authMiddleware())
		{
			// 图像识别
			auth.POST("/recognize/upload", uploadImageHandler)
			auth.POST("/recognize/analyze", analyzeImageHandler)

			// 历史记录
			auth.GET("/records", getRecordsHandler)
			auth.GET("/records/:id", getRecordHandler)
			auth.DELETE("/records/:id", deleteRecordHandler)
			auth.POST("/records/backfill_images", backfillRecordImagesHandler)
			auth.POST("/records/backfill_confidence", backfillRecordConfidenceHandler)
		}
	}

	return router
}
