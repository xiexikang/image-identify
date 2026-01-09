package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/disintegration/imaging"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	_ "golang.org/x/image/bmp"
)

// 上传图片请求结构
type UploadImageRequest struct {
	Image string `json:"image" binding:"required"` // base64编码的图片
	Type  string `json:"type" binding:"required"`  // 识别类型
}

// 图片上传处理器
func uploadImageHandler(c *gin.Context) {
	file, header, err := c.Request.FormFile("image")
	if err != nil {
		errorResponse(c, http.StatusBadRequest, "Image file is required")
		return
	}
	defer file.Close()

	// 获取用户ID
	userID := c.GetUint("user_id")
	recognitionType := c.PostForm("type")

	// 验证文件类型
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !isValidImageExt(ext) {
		errorResponse(c, http.StatusBadRequest, "Invalid image format")
		return
	}

	// 生成唯一文件名
	filename := fmt.Sprintf("%s_%s%s", uuid.New().String(), time.Now().Format("20060102150405"), ext)

	// 创建上传目录
	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		errorResponse(c, http.StatusInternalServerError, "Failed to create upload directory")
		return
	}

	// 保存原图
	originalPath := filepath.Join(uploadDir, filename)
	if err := saveUploadedFile(file, originalPath); err != nil {
		errorResponse(c, http.StatusInternalServerError, "Failed to save image")
		return
	}

	// 压缩图片（可选）
	compressedPath := filepath.Join(uploadDir, "compressed_"+filename)
	if err := compressImage(originalPath, compressedPath); err != nil {
		// 如果压缩失败，继续使用原图
		compressedPath = originalPath
	}

	// 上传到百度智能云（这里只是保存到本地，实际应该上传到云存储）
	imageURL := "/uploads/" + filepath.Base(compressedPath)

	// 创建识别记录
	record := RecognitionRecord{
		UserID:   userID,
		Type:     recognitionType,
		ImageURL: imageURL,
	}

	if err := db.Create(&record).Error; err != nil {
		errorResponse(c, http.StatusInternalServerError, "Failed to create record")
		return
	}

	successResponse(c, gin.H{
		"record_id": record.ID,
		"image_url": imageURL,
		"message":   "Image uploaded successfully",
	})
}

// 分析图片处理器
func analyzeImageHandler(c *gin.Context) {
	var req UploadImageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		errorResponse(c, http.StatusBadRequest, "Invalid request")
		return
	}

	// 获取用户ID
	userID := c.GetUint("user_id")

	// 处理可能带有 data URL 前缀的 base64
	img := req.Image
	if i := strings.Index(img, ","); i != -1 && strings.Contains(img[:i], "base64") {
		img = img[i+1:]
	}

	// 解码base64图片
	imageData, err := base64.StdEncoding.DecodeString(img)
	if err != nil {
		errorResponse(c, http.StatusBadRequest, "Invalid image data")
		return
	}

	// 保存图片到本地以便历史记录展示
	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		errorResponse(c, http.StatusInternalServerError, "Failed to create upload directory")
		return
	}
	filename := fmt.Sprintf("%s_%s.jpg", uuid.New().String(), time.Now().Format("20060102150405"))
	originalPath := filepath.Join(uploadDir, filename)
	processed, perr := constrainImageBytes(imageData)
	if perr != nil {
		processed = imageData
	}
	if werr := os.WriteFile(originalPath, processed, 0644); werr != nil {
		errorResponse(c, http.StatusInternalServerError, "Failed to save image")
		return
	}
	compressedPath := filepath.Join(uploadDir, "compressed_"+filename)
	if cerr := compressImage(originalPath, compressedPath); cerr != nil {
		compressedPath = originalPath
	}
	imageURL := "/uploads/" + filepath.Base(compressedPath)

    top, results, resp, err := callBaiduAI(imageData, req.Type)
	if err != nil {
		log.Printf("recognition error: %v", err)
		code, msg := mapRecognitionError(err)
		errorResponse(c, code, msg)
		return
	}

	// 保存识别结果到数据库（统一以 keyword 优先）
	kw := top.Keyword
	if kw == "" {
		kw = top.Name
	}
    conf := float64(top.Score)
    if conf == 0 {
        conf = float64(top.Probability)
    }
    record := RecognitionRecord{
        UserID:      userID,
        Type:        req.Type,
        Result:      kw,
        Confidence:  conf,
        RawResponse: fmt.Sprintf("%+v", top),
        ImageURL:    imageURL,
    }

	if err := db.Create(&record).Error; err != nil {
		errorResponse(c, http.StatusInternalServerError, "Failed to save result")
		return
	}

    successResponse(c, gin.H{
        "record_id":   record.ID,
        "keyword":     kw,
        "name":        top.Name,
        "score": func() float64 {
            s := float64(top.Score)
            if s == 0 {
                s = float64(top.Probability)
            }
            return s
        }(),
        "description": getDescriptionByType(kw, req.Type),
        "image_url":   imageURL,
        "results": func() []map[string]interface{} {
            out := make([]map[string]interface{}, 0, len(results))
            for _, r := range results {
                k := r.Keyword
                if k == "" {
                    k = r.Name
                }
                item := map[string]interface{}{
                    "keyword": k,
                    "name":    r.Name,
                    "score": func() float64 {
                        s := float64(r.Score)
                        if s == 0 {
                            s = float64(r.Probability)
                        }
                        return s
                    }(),
                }
                if r.Root != "" {
                    item["root"] = r.Root
                }
                if r.Year != "" {
                    item["year"] = r.Year
                }
                if r.Type != 0 {
                    item["type"] = r.Type
                }
                if r.Location != nil {
                    item["location"] = r.Location
                }
                out = append(out, item)
            }
            return out
        }(),
        "color_result": func() interface{} {
            if resp != nil && resp.ColorResult != "" && req.Type == "car" {
                return resp.ColorResult
            }
            return nil
        }(),
        "location_result": func() interface{} {
            if resp != nil && resp.LocationResult != nil && req.Type == "car" {
                return resp.LocationResult
            }
            return nil
        }(),
    })
}

// 验证图片扩展名
func isValidImageExt(ext string) bool {
	// 百度接口仅支持 jpg/png/bmp
	validExts := []string{".jpg", ".jpeg", ".png", ".bmp"}
	ext = strings.ToLower(ext)
	for _, valid := range validExts {
		if ext == valid {
			return true
		}
	}
	return false
}

// 保存上传的文件
func saveUploadedFile(file multipart.File, dst string) error {
	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, file)
	return err
}

// 压缩图片
func compressImage(src, dst string) error {
	srcImage, err := imaging.Open(src)
	if err != nil {
		return err
	}

	// 调整图片大小，最大宽度800px
	width := 800
	if srcImage.Bounds().Dx() < width {
		width = srcImage.Bounds().Dx()
	}

	resized := imaging.Resize(srcImage, width, 0, imaging.Lanczos)
	return imaging.Save(resized, dst, imaging.JPEGQuality(85))
}

// 调用百度AI进行图像识别
func callBaiduAI(imageData []byte, recognitionType string) (*BaiduAIResult, []BaiduAIResult, *BaiduAIResponse, error) {
    if (os.Getenv("BAIDU_API_KEY") == "" || os.Getenv("BAIDU_SECRET_KEY") == "") && os.Getenv("APP_ENV") != "production" {
        return &BaiduAIResult{Name: "模拟识别结果", Score: 0.0}, nil, &BaiduAIResponse{}, nil
    }
	// 获取百度AI access token
	accessToken, err := getCachedBaiduAccessToken()
	if err != nil || accessToken == "" {
		// 如果缓存中没有，重新获取
		newToken, expiresIn, tokenErr := getBaiduAccessToken()
        if tokenErr != nil {
            return nil, nil, nil, tokenErr
        }
        accessToken = newToken
		// 缓存新的token
		cacheBaiduAccessToken(accessToken, expiresIn)
	}

	// 根据识别类型选择不同的API
	apiURL := getBaiduAIURL(recognitionType, accessToken)

	var req *http.Request

	// 先在服务端约束尺寸与体积，保证满足百度接口要求
	processed, err := constrainImageBytes(imageData)
    if err != nil {
        return nil, nil, nil, err
    }

	if recognitionType == "general" {
		imgBase64 := base64.StdEncoding.EncodeToString(processed)
		form := url.Values{}
		form.Set("image", imgBase64)

		req, err = http.NewRequest("POST", apiURL, strings.NewReader(form.Encode()))
        if err != nil {
            return nil, nil, nil, err
        }
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	} else {
		imgBase64 := base64.StdEncoding.EncodeToString(processed)
		form := url.Values{}
		form.Set("image", imgBase64)

		req, err = http.NewRequest("POST", apiURL, strings.NewReader(form.Encode()))
        if err != nil {
            return nil, nil, nil, err
        }
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	}

	client := &http.Client{Timeout: 30 * time.Second}
    resp, err := client.Do(req)
    if err != nil {
        return nil, nil, nil, err
    }
	defer resp.Body.Close()

    bodyBytes, readErr := io.ReadAll(resp.Body)
    if readErr != nil {
        return nil, nil, nil, readErr
    }

	// 非200时解析错误信息
	if resp.StatusCode != http.StatusOK {
		var errBody struct {
			ErrorCode int    `json:"error_code"`
			ErrorMsg  string `json:"error_msg"`
		}
		if json.Unmarshal(bodyBytes, &errBody) == nil && errBody.ErrorMsg != "" {
            return nil, nil, nil, fmt.Errorf("baidu api error %d: %s", errBody.ErrorCode, errBody.ErrorMsg)
        }
		snippet := string(bodyBytes)
		if len(snippet) > 120 {
			snippet = snippet[:120]
		}
        return nil, nil, nil, fmt.Errorf("baidu api http %d: %s", resp.StatusCode, snippet)
    }

	// 解析成功响应
	parseBytes := bodyBytes
	if recognitionType == "general" {
		if i := bytes.IndexByte(parseBytes, '{'); i > 0 {
			parseBytes = parseBytes[i:]
		}
	}
    if recognitionType == "landmark" {
        var lr struct {
            LogID int64 `json:"log_id"`
            Result struct {
                Landmark string `json:"landmark"`
            } `json:"result"`
        }
        if err := json.Unmarshal(parseBytes, &lr); err != nil {
            snippet := string(bodyBytes)
            if len(snippet) > 120 {
                snippet = snippet[:120]
            }
            return nil, nil, nil, fmt.Errorf("baidu api decode error: %s", snippet)
        }
        // Create a proper BaiduAIResult with default score for landmark
        landmarkResult := BaiduAIResult{
            Name:  lr.Result.Landmark,
            Score: Score64(0.95), // Default confidence for landmark
        }
        br := BaiduAIResponse{
            LogID:     lr.LogID,
            Results:   []BaiduAIResult{landmarkResult},
            ResultNum: 1,
        }
        return &br.Results[0], br.Results, &br, nil
    }
    var result BaiduAIResponse
    if err := json.Unmarshal(parseBytes, &result); err != nil {
        snippet := string(bodyBytes)
        if len(snippet) > 120 {
            snippet = snippet[:120]
        }
        return nil, nil, nil, fmt.Errorf("baidu api decode error: %s", snippet)
    }
    
    // Handle different response structures for different recognition types
    if recognitionType == "logo" || recognitionType == "car" {
        // For logo and car, ensure we have proper results structure
        if len(result.Results) == 0 && result.ResultNum > 0 {
            // If no results but result_num > 0, create a default result
            result.Results = []BaiduAIResult{{
                Name:  "未识别",
                Score: Score64(0.0),
            }}
        }
    }
    
    if len(result.Results) > 0 {
        return &result.Results[0], result.Results, &result, nil
    }
    
    // Return a proper default result for all types
    defaultResult := BaiduAIResult{
        Name:  "未识别",
        Score: Score64(0.0),
    }
    return &defaultResult, []BaiduAIResult{defaultResult}, &result, nil
}

// 约束图片：最长边不超过4096、最短边不少于15，压缩为JPEG并确保base64体积不超过4MB
func constrainImageBytes(src []byte) ([]byte, error) {
	img, err := imaging.Decode(bytes.NewReader(src))
	if err != nil {
		return nil, fmt.Errorf("failed to decode image: %w", err)
	}
	b := img.Bounds()
	w, h := b.Dx(), b.Dy()
	if w < 15 || h < 15 {
		return nil, fmt.Errorf("image too small: %dx%d", w, h)
	}
	// 缩放到最长边不超过4096
	maxSide := w
	if h > maxSide {
		maxSide = h
	}
	if maxSide > 4096 {
		scale := float64(4096) / float64(maxSide)
		newW := int(float64(w) * scale)
		newH := int(float64(h) * scale)
		img = imaging.Resize(img, newW, newH, imaging.Lanczos)
	}
	// 以递减质量压缩，直到base64体积小于4MB
	buf := &bytes.Buffer{}
	quality := 85
	for {
		buf.Reset()
		if err := imaging.Encode(buf, img, imaging.JPEG, imaging.JPEGQuality(quality)); err != nil {
			return nil, err
		}
		// base64编码后的长度
		encLen := base64.StdEncoding.EncodedLen(buf.Len())
		if encLen <= 4*1024*1024 { // 4MB
			break
		}
		quality -= 10
		if quality < 50 {
			return nil, fmt.Errorf("image too large after compression")
		}
	}
	return buf.Bytes(), nil
}

// 获取百度AI access token
func getBaiduAccessToken() (string, int, error) {
	apiKey := os.Getenv("BAIDU_API_KEY")
	secretKey := os.Getenv("BAIDU_SECRET_KEY")

	if apiKey == "" || secretKey == "" {
		return "", 0, fmt.Errorf("baidu api credentials not configured")
	}

	url := fmt.Sprintf("https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=%s&client_secret=%s",
		apiKey, secretKey)

	resp, err := http.Get(url)
	if err != nil {
		return "", 0, err
	}
	defer resp.Body.Close()

	var tokenResp struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return "", 0, err
	}

	return tokenResp.AccessToken, tokenResp.ExpiresIn, nil
}

// 获取百度AI识别API URL
func getBaiduAIURL(recognitionType, accessToken string) string {
	base := "https://aip.baidubce.com/"
	var path string
	switch recognitionType {
	case "general":
		path = "rest/2.0/image-classify/v2/advanced_general"
	case "animal":
		path = "rest/2.0/image-classify/v1/animal"
	case "plant":
		path = "rest/2.0/image-classify/v1/plant"
	case "ingredient":
		// 果蔬识别（文档路径包含 classify/ingredient）
		path = "rest/2.0/image-classify/v1/classify/ingredient"
	case "dish":
		// 菜品识别为 v2
		path = "rest/2.0/image-classify/v2/dish"
	case "landmark":
		// 地标识别
		path = "rest/2.0/image-classify/v1/landmark"
	case "logo":
		// Logo识别
		path = "rest/2.0/image-classify/v2/logo"
	case "car":
		path = "rest/2.0/image-classify/v1/car"
	default:
		// 兜底：百度通用物体识别（rest）
		path = "rest/2.0/image-classify/v1/advanced_general"
	}
	return fmt.Sprintf("%s%s?access_token=%s", base, path, accessToken)
}

// 根据识别类型获取描述信息
func getDescriptionByType(name, recognitionType string) string {
	switch recognitionType {
	case "animal":
		return fmt.Sprintf("这是%s，一种动物", name)
	case "plant":
		return fmt.Sprintf("这是%s，一种植物", name)
	case "ingredient":
		return fmt.Sprintf("这是%s，一种果蔬食材", name)
	case "dish":
		return fmt.Sprintf("这是%s，一道菜品", name)
	case "landmark":
		return fmt.Sprintf("这是%s，一处地标", name)
	case "logo":
		return fmt.Sprintf("这是%s，一个logo", name)
	case "car":
		return fmt.Sprintf("这是%s，一款车型", name)
	default:
		return fmt.Sprintf("识别结果：%s", name)
	}
}

func mapRecognitionError(err error) (int, string) {
	s := err.Error()
	if strings.Contains(s, "credentials not configured") {
		return http.StatusServiceUnavailable, "Baidu API未配置"
	}
	if strings.Contains(s, "image too small") {
		return http.StatusBadRequest, "图片尺寸过小"
	}
	if strings.Contains(s, "image too large") {
		return http.StatusBadRequest, "图片过大"
	}
	if strings.Contains(s, "failed to decode image") {
		return http.StatusBadRequest, "图片解码失败"
	}
	if strings.Contains(s, "baidu api error") || strings.Contains(s, "baidu api http") {
		return http.StatusBadGateway, s
	}
	if s == "EOF" {
		return http.StatusBadGateway, "Baidu接口响应异常"
	}
	return http.StatusInternalServerError, "Recognition failed"
}
