package main

import (
    "strconv"
    "net/http"
    "os"
    "path/filepath"
    "image/color"
    "regexp"

    "github.com/disintegration/imaging"
    "github.com/gin-gonic/gin"
)

// 获取识别记录列表
func getRecordsHandler(c *gin.Context) {
	userID := c.GetUint("user_id")
	
	// 获取分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	recordType := c.Query("type") // 筛选类型
	
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	// 构建查询
	query := db.Where("user_id = ?", userID)
	if recordType != "" {
		query = query.Where("type = ?", recordType)
	}

	// 查询总数
	var total int64
	if err := query.Model(&RecognitionRecord{}).Count(&total).Error; err != nil {
		errorResponse(c, http.StatusInternalServerError, "Failed to count records")
		return
	}

	// 查询记录
	var records []RecognitionRecord
	offset := (page - 1) * pageSize
	if err := query.Order("created_at DESC").Limit(pageSize).Offset(offset).Find(&records).Error; err != nil {
		errorResponse(c, http.StatusInternalServerError, "Failed to get records")
		return
	}

	paginatedResponse(c, records, total, page, pageSize)
}

// 获取单条记录详情
func getRecordHandler(c *gin.Context) {
	userID := c.GetUint("user_id")
	recordID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		errorResponse(c, http.StatusBadRequest, "Invalid record ID")
		return
	}

	var record RecognitionRecord
	if err := db.Where("id = ? AND user_id = ?", recordID, userID).First(&record).Error; err != nil {
		errorResponse(c, http.StatusNotFound, "Record not found")
		return
	}

	successResponse(c, record)
}

// 删除记录
func deleteRecordHandler(c *gin.Context) {
	userID := c.GetUint("user_id")
	recordID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		errorResponse(c, http.StatusBadRequest, "Invalid record ID")
		return
	}

	result := db.Where("id = ? AND user_id = ?", recordID, userID).Delete(&RecognitionRecord{})
	if result.Error != nil {
		errorResponse(c, http.StatusInternalServerError, "Failed to delete record")
		return
	}

	if result.RowsAffected == 0 {
		errorResponse(c, http.StatusNotFound, "Record not found")
		return
	}

	successResponse(c, gin.H{"message": "Record deleted successfully"})
}

// 为缺失图片的记录回填占位图
func backfillRecordImagesHandler(c *gin.Context) {
    userID := c.GetUint("user_id")

    // 查找当前用户 image_url 为空的记录
    var records []RecognitionRecord
    if err := db.Where("user_id = ? AND (image_url = '' OR image_url IS NULL)", userID).Find(&records).Error; err != nil {
        errorResponse(c, http.StatusInternalServerError, "Failed to query records")
        return
    }

    // 确保上传目录存在
    uploadDir := "./uploads"
    if err := os.MkdirAll(uploadDir, 0755); err != nil {
        errorResponse(c, http.StatusInternalServerError, "Failed to create upload directory")
        return
    }

    // 为不同类型准备占位图路径缓存
    placeholderPathCache := map[string]string{}

    created := 0
    for i := range records {
        recType := records[i].Type
        // 取占位图路径（不存在则创建）
        p, err := ensurePlaceholderImage(uploadDir, recType)
        if err != nil {
            errorResponse(c, http.StatusInternalServerError, "Failed to create placeholder image")
            return
        }
        // 缓存路径，避免重复创建
        placeholderPathCache[recType] = p
        // 更新记录的 image_url（使用静态路由路径）
        records[i].ImageURL = "/uploads/" + filepath.Base(p)
        if err := db.Model(&records[i]).Update("image_url", records[i].ImageURL).Error; err != nil {
            errorResponse(c, http.StatusInternalServerError, "Failed to update record image_url")
            return
        }
        created++
    }

    successResponse(c, gin.H{
        "updated": created,
    })
}

func backfillRecordConfidenceHandler(c *gin.Context) {
    userID := c.GetUint("user_id")
    var records []RecognitionRecord
    if err := db.Where("user_id = ? AND (confidence = 0 OR confidence IS NULL) AND raw_response <> ''", userID).Find(&records).Error; err != nil {
        errorResponse(c, http.StatusInternalServerError, "Failed to query records")
        return
    }
    reScore := regexp.MustCompile(`Score:([0-9]+\.?[0-9]*)`)
    reProb := regexp.MustCompile(`Probability:([0-9]+\.?[0-9]*)`)
    updated := 0
    for i := range records {
        s := records[i].RawResponse
        val := 0.0
        if m := reScore.FindStringSubmatch(s); len(m) > 1 {
            if v, err := strconv.ParseFloat(m[1], 64); err == nil {
                val = v
            }
        }
        if val == 0 {
            if m := reProb.FindStringSubmatch(s); len(m) > 1 {
                if v, err := strconv.ParseFloat(m[1], 64); err == nil {
                    val = v
                }
            }
        }
        if val > 0 {
            if err := db.Model(&records[i]).Update("confidence", val).Error; err != nil {
                errorResponse(c, http.StatusInternalServerError, "Failed to update record confidence")
                return
            }
            updated++
        }
    }
    successResponse(c, gin.H{"updated": updated})
}

func ensurePlaceholderImage(uploadDir, recType string) (string, error) {
    name := "placeholder_" + recType + ".jpg"
    full := filepath.Join(uploadDir, name)
    if _, err := os.Stat(full); err == nil {
        return full, nil
    }
    // 创建简单的纯色占位图
    img := imaging.New(300, 300, placeholderColor(recType))
    if err := imaging.Save(img, full, imaging.JPEGQuality(85)); err != nil {
        return "", err
    }
    return full, nil
}

func placeholderColor(recType string) color.NRGBA {
    switch recType {
    case "animal":
        return color.NRGBA{R: 255, G: 179, B: 71, A: 255}
    case "plant":
        return color.NRGBA{R: 72, G: 187, B: 120, A: 255}
    case "ingredient":
        return color.NRGBA{R: 244, G: 63, B: 94, A: 255}
    case "dish":
        return color.NRGBA{R: 168, G: 85, B: 247, A: 255}
    case "landmark":
        return color.NRGBA{R: 59, G: 130, B: 246, A: 255}
    case "logo":
        return color.NRGBA{R: 13, G: 148, B: 136, A: 255}
    case "car":
        return color.NRGBA{R: 100, G: 116, B: 139, A: 255}
    default:
        return color.NRGBA{R: 229, G: 231, B: 235, A: 255} // gray
    }
}