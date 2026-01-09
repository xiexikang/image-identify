package main

import (
    "encoding/json"
    "fmt"
    "strconv"
    "time"
)

// 用户模型
type User struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Username  string    `json:"username" gorm:"uniqueIndex;not null"`
	Password  string    `json:"-" gorm:"not null"`
	Avatar    string    `json:"avatar"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// 识别记录模型
type RecognitionRecord struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	UserID       uint      `json:"user_id" gorm:"index"`
	Type         string    `json:"type" gorm:"index"` // general, animal, plant, ingredient, dish
	ImageURL     string    `json:"image_url"`
	Result       string    `json:"result" gorm:"type:text"`
	Confidence   float64   `json:"confidence"`
	RawResponse  string    `json:"raw_response" gorm:"type:text"`
	CreatedAt    time.Time `json:"created_at"`
	
	// 关联用户
	User User `json:"user" gorm:"foreignKey:UserID"`
}

// 百度AI响应结构
type BaiduAIResponse struct {
    LogID          int64       `json:"log_id"`
    ResultNum      int         `json:"result_num"`
    Results        []BaiduAIResult `json:"result"`
    ColorResult    string      `json:"color_result,omitempty"`
    LocationResult *LocationBox `json:"location_result,omitempty"`
}

type BaiduAIResult struct {
    Name       string  `json:"name"`
    Keyword    string  `json:"keyword,omitempty"`
    Root       string  `json:"root,omitempty"`
    Score      Score64 `json:"score"`
    Year       string  `json:"year,omitempty"`
    Probability Score64 `json:"probability,omitempty"`
    Type        int     `json:"type,omitempty"`
    Location    *LocationBox `json:"location,omitempty"`
    BaikeInfo  *BaikeInfo `json:"baike_info,omitempty"`
}

type LocationBox struct {
    Top    int `json:"top"`
    Left   int `json:"left"`
    Width  int `json:"width"`
    Height int `json:"height"`
}

type Score64 float64

func (s *Score64) UnmarshalJSON(b []byte) error {
    var f float64
    if err := json.Unmarshal(b, &f); err == nil {
        *s = Score64(f)
        return nil
    }
    var str string
    if err := json.Unmarshal(b, &str); err == nil {
        v, err := strconv.ParseFloat(str, 64)
        if err != nil {
            return fmt.Errorf("invalid score: %v", err)
        }
        *s = Score64(v)
        return nil
    }
    return fmt.Errorf("invalid score format")
}

type BaikeInfo struct {
	BaikeURL    string `json:"baike_url"`
	ImageURL    string `json:"image_url"`
	Description string `json:"description"`
}
