package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"small-victory-backend/internal/database"
	"small-victory-backend/internal/models"
	"small-victory-backend/internal/services"
)

type AppHandler struct {
	db         *database.DB
	cloudinary *services.CloudinaryService
}

func NewAppHandler(db *database.DB, cld *services.CloudinaryService) *AppHandler {
	return &AppHandler{
		db:         db,
		cloudinary: cld,
	}
}

// GET /api/health
func (h *AppHandler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"service":   "small-victory-api",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// GET /api/days/:date
func (h *AppHandler) GetDay(c *gin.Context) {
	dateStr := c.Param("date")
	if dateStr == "" {
		dateStr = time.Now().Format("2006-01-02")
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	var record models.DayRecord
	err := h.db.Days.FindOne(ctx, bson.M{"date": dateStr}).Decode(&record)

	if err == mongo.ErrNoDocuments {
		// Return fresh template for the requested day
		record = models.DayRecord{
			Date:              dateStr,
			MorningIntention:  "",
			Energy:            3,
			Goals:             []models.GoalItem{},
			EveningReflection: "",
			EveningMood:       3,
			IsDayClosed:       false,
			CreatedAt:         time.Now(),
			UpdatedAt:         time.Now(),
		}
		c.JSON(http.StatusOK, record)
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể truy vấn ngày: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, record)
}

// POST /api/days/:date/intention
func (h *AppHandler) UpdateIntention(c *gin.Context) {
	dateStr := c.Param("date")
	var req models.UpdateIntentionReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ: " + err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	update := bson.M{
		"$set": bson.M{
			"morning_intention": req.MorningIntention,
			"energy":            req.Energy,
			"updated_at":        time.Now(),
		},
		"$setOnInsert": bson.M{
			"date":        dateStr,
			"goals":       []models.GoalItem{},
			"created_at":  time.Now(),
			"is_day_closed": false,
		},
	}

	opts := options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After)
	var updated models.DayRecord
	err := h.db.Days.FindOneAndUpdate(ctx, bson.M{"date": dateStr}, update, opts).Decode(&updated)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi lưu mục đích đầu ngày: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, updated)
}

// POST /api/days/:date/goals
func (h *AppHandler) AddGoal(c *gin.Context) {
	dateStr := c.Param("date")
	var req models.AddGoalReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nội dung mục tiêu là bắt buộc"})
		return
	}

	if req.Priority == "" {
		req.Priority = models.PriorityMustDo
	}

	goal := models.GoalItem{
		ID:        fmt.Sprintf("goal_%d", time.Now().UnixNano()),
		Text:      req.Text,
		Priority:  req.Priority,
		Completed: false,
		CreatedAt: time.Now(),
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	update := bson.M{
		"$push": bson.M{"goals": goal},
		"$set":  bson.M{"updated_at": time.Now()},
		"$setOnInsert": bson.M{
			"date":              dateStr,
			"morning_intention": "",
			"energy":            3,
			"created_at":        time.Now(),
			"is_day_closed":     false,
		},
	}

	opts := options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After)
	var updated models.DayRecord
	err := h.db.Days.FindOneAndUpdate(ctx, bson.M{"date": dateStr}, update, opts).Decode(&updated)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi thêm mục tiêu: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, updated)
}

// PUT /api/days/:date/goals/:goalId
func (h *AppHandler) UpdateGoal(c *gin.Context) {
	dateStr := c.Param("date")
	goalID := c.Param("goalId")

	var req models.UpdateGoalReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu cập nhật không hợp lệ"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	setMap := bson.M{"updated_at": time.Now()}
	if req.Text != nil {
		setMap["goals.$.text"] = *req.Text
	}
	if req.Priority != nil {
		setMap["goals.$.priority"] = *req.Priority
	}
	if req.Completed != nil {
		setMap["goals.$.completed"] = *req.Completed
		if *req.Completed {
			now := time.Now()
			setMap["goals.$.completed_at"] = now
		} else {
			setMap["goals.$.completed_at"] = nil
		}
	}

	filter := bson.M{
		"date":     dateStr,
		"goals.id": goalID,
	}

	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	var updated models.DayRecord
	err := h.db.Days.FindOneAndUpdate(ctx, filter, bson.M{"$set": setMap}, opts).Decode(&updated)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi cập nhật mục tiêu: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, updated)
}

// DELETE /api/days/:date/goals/:goalId
func (h *AppHandler) DeleteGoal(c *gin.Context) {
	dateStr := c.Param("date")
	goalID := c.Param("goalId")

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	filter := bson.M{"date": dateStr}
	update := bson.M{
		"$pull": bson.M{"goals": bson.M{"id": goalID}},
		"$set":  bson.M{"updated_at": time.Now()},
	}

	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	var updated models.DayRecord
	err := h.db.Days.FindOneAndUpdate(ctx, filter, update, opts).Decode(&updated)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi xóa mục tiêu: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, updated)
}

// POST /api/days/:date/morning-photo
func (h *AppHandler) UploadMorningPhoto(c *gin.Context) {
	dateStr := c.Param("date")

	var photoURL, publicID string
	var err error

	// Check if uploaded as multipart file
	file, fileHeader, fileErr := c.Request.FormFile("photo")
	if fileErr == nil && file != nil {
		defer file.Close()
		photoURL, publicID, err = h.cloudinary.UploadImage(c.Request.Context(), file, fileHeader, "morning-photos")
	} else {
		// Check if uploaded as base64 JSON payload
		var jsonBody struct {
			PhotoBase64 string `json:"photo_base64"`
		}
		if bindErr := c.ShouldBindJSON(&jsonBody); bindErr == nil && jsonBody.PhotoBase64 != "" {
			photoURL, publicID, err = h.cloudinary.UploadBase64(c.Request.Context(), jsonBody.PhotoBase64, "morning-photos")
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Vui lòng cung cấp file ảnh hoặc chuỗi base64"})
			return
		}
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi tải ảnh lên Cloudinary: " + err.Error()})
		return
	}

	now := time.Now()
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	update := bson.M{
		"$set": bson.M{
			"morning_photo_url":       photoURL,
			"morning_photo_public_id": publicID,
			"morning_photo_time":      now,
			"updated_at":              now,
		},
		"$setOnInsert": bson.M{
			"date":              dateStr,
			"morning_intention": "",
			"energy":            3,
			"goals":             []models.GoalItem{},
			"created_at":        now,
			"is_day_closed":     false,
		},
	}

	opts := options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After)
	var updated models.DayRecord
	err = h.db.Days.FindOneAndUpdate(ctx, bson.M{"date": dateStr}, update, opts).Decode(&updated)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi cập nhật ảnh ngày: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, updated)
}

// POST /api/days/:date/evening
func (h *AppHandler) SubmitEveningReview(c *gin.Context) {
	dateStr := c.Param("date")
	var req models.EveningReviewReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu tổng kết cuối ngày không hợp lệ"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	update := bson.M{
		"$set": bson.M{
			"evening_reflection": req.EveningReflection,
			"evening_mood":       req.EveningMood,
			"is_day_closed":      req.IsDayClosed,
			"updated_at":         time.Now(),
		},
		"$setOnInsert": bson.M{
			"date":              dateStr,
			"morning_intention": "",
			"energy":            3,
			"goals":             []models.GoalItem{},
			"created_at":        time.Now(),
		},
	}

	opts := options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After)
	var updated models.DayRecord
	err := h.db.Days.FindOneAndUpdate(ctx, bson.M{"date": dateStr}, update, opts).Decode(&updated)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi lưu tổng kết cuối ngày: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, updated)
}

// GET /api/wins
func (h *AppHandler) GetWins(c *gin.Context) {
	dateFilter := c.Query("date")

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	filter := bson.M{}
	if dateFilter != "" {
		filter["date"] = dateFilter
	}

	findOptions := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
	cursor, err := h.db.Wins.Find(ctx, filter, findOptions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi truy vấn chiến thắng nhỏ: " + err.Error()})
		return
	}
	defer cursor.Close(ctx)

	var wins []models.WinRecord
	if err := cursor.All(ctx, &wins); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi đọc dữ liệu: " + err.Error()})
		return
	}

	if wins == nil {
		wins = []models.WinRecord{}
	}

	c.JSON(http.StatusOK, wins)
}

// POST /api/wins
func (h *AppHandler) CreateWin(c *gin.Context) {
	var title, note, tag, dateStr, photoURL, publicID string
	var err error

	// Handle multipart form if file provided
	contentType := c.ContentType()
	if contentType == "multipart/form-data" {
		title = c.PostForm("title")
		note = c.PostForm("note")
		tag = c.PostForm("tag")
		dateStr = c.PostForm("date")

		file, fileHeader, fileErr := c.Request.FormFile("photo")
		if fileErr == nil && file != nil {
			defer file.Close()
			photoURL, publicID, err = h.cloudinary.UploadImage(c.Request.Context(), file, fileHeader, "wins")
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi tải ảnh chiến thắng lên Cloudinary: " + err.Error()})
				return
			}
		}
	} else {
		// JSON Body
		var jsonBody struct {
			Title       string `json:"title" binding:"required"`
			Note        string `json:"note"`
			Tag         string `json:"tag"`
			Date        string `json:"date"`
			PhotoBase64 string `json:"photo_base64"`
			PhotoURL    string `json:"photo_url"`
		}

		if err := c.ShouldBindJSON(&jsonBody); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Tiêu đề chiến thắng là bắt buộc: " + err.Error()})
			return
		}

		title = jsonBody.Title
		note = jsonBody.Note
		tag = jsonBody.Tag
		dateStr = jsonBody.Date
		photoURL = jsonBody.PhotoURL

		if jsonBody.PhotoBase64 != "" {
			photoURL, publicID, err = h.cloudinary.UploadBase64(c.Request.Context(), jsonBody.PhotoBase64, "wins")
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi tải ảnh base64: " + err.Error()})
				return
			}
		}
	}

	if title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Vui lòng nhập tên chiến thắng nhỏ"})
		return
	}

	if dateStr == "" {
		dateStr = time.Now().Format("2006-01-02")
	}
	if tag == "" {
		tag = "Bản thân"
	}

	win := models.WinRecord{
		ID:            primitive.NewObjectID(),
		Date:          dateStr,
		Title:         title,
		Note:          note,
		PhotoURL:      photoURL,
		PhotoPublicID: publicID,
		Tag:           tag,
		CreatedAt:     time.Now(),
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	_, err = h.db.Wins.InsertOne(ctx, win)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi lưu chiến thắng vào MongoDB: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, win)
}

// DELETE /api/wins/:id
func (h *AppHandler) DeleteWin(c *gin.Context) {
	idStr := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID chiến thắng không hợp lệ"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	res, err := h.db.Wins.DeleteOne(ctx, bson.M{"_id": objID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi xóa chiến thắng: " + err.Error()})
		return
	}

	if res.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy chiến thắng này"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Đã xóa chiến thắng thành công"})
}

// GET /api/stats
func (h *AppHandler) GetStats(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	// Count total wins
	totalWins, _ := h.db.Wins.CountDocuments(ctx, bson.M{})

	// Retrieve all days
	cursor, err := h.db.Days.Find(ctx, bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi tính toán thống kê: " + err.Error()})
		return
	}
	defer cursor.Close(ctx)

	var days []models.DayRecord
	if err := cursor.All(ctx, &days); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi nạp dữ liệu ngày: " + err.Error()})
		return
	}

	totalGoals := 0
	completedGoals := 0
	activeDates := make(map[string]bool)

	for _, d := range days {
		if d.MorningIntention != "" || len(d.Goals) > 0 || d.MorningPhotoURL != "" {
			activeDates[d.Date] = true
		}
		for _, g := range d.Goals {
			totalGoals++
			if g.Completed {
				completedGoals++
			}
		}
	}

	// Also add dates that have wins
	winDatesCursor, err := h.db.Wins.Distinct(ctx, "date", bson.M{})
	if err == nil {
		for _, vd := range winDatesCursor {
			if ds, ok := vd.(string); ok {
				activeDates[ds] = true
			}
		}
	}

	// Calculate streak
	streak := 0
	current := time.Now()
	todayStr := current.Format("2006-01-02")
	if !activeDates[todayStr] {
		current = current.AddDate(0, 0, -1)
	}

	for {
		dStr := current.Format("2006-01-02")
		if activeDates[dStr] {
			streak++
			current = current.AddDate(0, 0, -1)
		} else {
			break
		}
	}

	var completionRate float64
	if totalGoals > 0 {
		completionRate = float64(completedGoals) / float64(totalGoals) * 100
	}

	c.JSON(http.StatusOK, models.StatsResponse{
		Streak:         streak,
		TotalWins:      int(totalWins),
		TotalGoals:     totalGoals,
		CompletedGoals: completedGoals,
		CompletionRate: completionRate,
		TotalDaysCount: len(activeDates),
	})
}
