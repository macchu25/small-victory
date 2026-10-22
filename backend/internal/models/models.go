package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// GoalPriority indicates how crucial a morning goal is
type GoalPriority string

const (
	PriorityMustDo GoalPriority = "must_do" // 🔥 Quan trọng nhất
	PriorityShould GoalPriority = "should"  // ⚡ Nên làm
	PriorityBonus  GoalPriority = "bonus"   // 🌱 Mở rộng / Điểm cộng
)

// GoalItem represents an actionable goal set in the morning
type GoalItem struct {
	ID          string       `json:"id" bson:"id"`
	Text        string       `json:"text" bson:"text"`
	Priority    GoalPriority `json:"priority" bson:"priority"`
	Completed   bool         `json:"completed" bson:"completed"`
	CompletedAt *time.Time   `json:"completed_at,omitempty" bson:"completed_at,omitempty"`
	CreatedAt   time.Time    `json:"created_at" bson:"created_at"`
}

// DayRecord stores everything for a single day: Morning Intention, Photo, Goals & Evening Review
type DayRecord struct {
	ID                   primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Date                 string             `json:"date" bson:"date"` // Format: YYYY-MM-DD
	MorningIntention     string             `json:"morning_intention" bson:"morning_intention"`
	Energy               int                `json:"energy" bson:"energy"` // 1-5 scale
	MorningPhotoURL      string             `json:"morning_photo_url,omitempty" bson:"morning_photo_url,omitempty"`
	MorningPhotoPublicID string             `json:"morning_photo_public_id,omitempty" bson:"morning_photo_public_id,omitempty"`
	MorningPhotoTime     *time.Time         `json:"morning_photo_time,omitempty" bson:"morning_photo_time,omitempty"`
	Goals                []GoalItem         `json:"goals" bson:"goals"`
	EveningReflection    string             `json:"evening_reflection" bson:"evening_reflection"`
	EveningMood          int                `json:"evening_mood" bson:"evening_mood"` // 1-5 scale
	IsDayClosed          bool               `json:"is_day_closed" bson:"is_day_closed"`
	CreatedAt            time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt            time.Time          `json:"updated_at" bson:"updated_at"`
}

// WinRecord stores a micro-win entry with text, tag, and optional Cloudinary photo
type WinRecord struct {
	ID            primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Date          string             `json:"date" bson:"date"` // Format: YYYY-MM-DD
	Title         string             `json:"title" bson:"title"`
	Note          string             `json:"note" bson:"note"`
	PhotoURL      string             `json:"photo_url,omitempty" bson:"photo_url,omitempty"`
	PhotoPublicID string             `json:"photo_public_id,omitempty" bson:"photo_public_id,omitempty"`
	Tag           string             `json:"tag" bson:"tag"` // #CôngViệc, #SứcKhỏe, #HọcTập, #BảnThân, #Khác
	CreatedAt     time.Time          `json:"created_at" bson:"created_at"`
}

// DTOs (Data Transfer Objects)

type UpdateIntentionReq struct {
	MorningIntention string `json:"morning_intention"`
	Energy           int    `json:"energy"`
}

type AddGoalReq struct {
	Text     string       `json:"text" binding:"required"`
	Priority GoalPriority `json:"priority"`
}

type UpdateGoalReq struct {
	Text      *string       `json:"text,omitempty"`
	Priority  *GoalPriority `json:"priority,omitempty"`
	Completed *bool         `json:"completed,omitempty"`
}

type EveningReviewReq struct {
	EveningReflection string `json:"evening_reflection"`
	EveningMood       int    `json:"evening_mood"`
	IsDayClosed       bool   `json:"is_day_closed"`
}

type StatsResponse struct {
	Streak         int     `json:"streak"`
	TotalWins      int     `json:"total_wins"`
	TotalGoals     int     `json:"total_goals"`
	CompletedGoals int     `json:"completed_goals"`
	CompletionRate float64 `json:"completion_rate"`
	TotalDaysCount int     `json:"total_days_count"`
}
