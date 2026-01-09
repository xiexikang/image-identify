package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// 登录请求结构
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// 注册请求结构
type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Avatar   string `json:"avatar"`
}

// 登录处理器
func loginHandler(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		errorResponse(c, http.StatusBadRequest, "Invalid request")
		return
	}

	// 查找用户
	var user User
	if err := db.Where("username = ?", req.Username).First(&user).Error; err != nil {
		errorResponse(c, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	// 验证密码
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		errorResponse(c, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	// 生成token
	token, err := generateToken(user.ID, user.Username)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	successResponse(c, gin.H{
		"token": token,
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"avatar":   user.Avatar,
		},
	})
}

// 注册处理器
func registerHandler(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		errorResponse(c, http.StatusBadRequest, "Invalid request")
		return
	}

	// 检查用户名是否已存在
	var existingUser User
	if err := db.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		errorResponse(c, http.StatusBadRequest, "Username already exists")
		return
	}

	// 加密密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	// 创建用户
	user := User{
		Username: req.Username,
		Password: string(hashedPassword),
		Avatar:   req.Avatar,
	}

	if err := db.Create(&user).Error; err != nil {
		errorResponse(c, http.StatusInternalServerError, "Failed to create user")
		return
	}

	// 生成token
	token, err := generateToken(user.ID, user.Username)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	successResponse(c, gin.H{
		"token": token,
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"avatar":   user.Avatar,
		},
	})
}