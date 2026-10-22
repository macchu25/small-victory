package database

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"small-victory-backend/internal/config"
)

type DB struct {
	Client   *mongo.Client
	Database *mongo.Database
	Days     *mongo.Collection
	Wins     *mongo.Collection
}

func ConnectDB(cfg *config.Config) (*DB, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOptions := options.Client().ApplyURI(cfg.MongoURI)
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, err
	}

	// Ping database
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Printf("[MongoDB] Warning: Ping failed (%v). Ensure MongoDB is running at %s", err, cfg.MongoURI)
		// We still return client so app can start, but log clearly
	} else {
		log.Printf("[MongoDB] Successfully connected to %s", cfg.MongoURI)
	}

	dbInstance := client.Database(cfg.MongoDBName)
	daysCol := dbInstance.Collection("days")
	winsCol := dbInstance.Collection("wins")

	// Create Indexes asynchronously so it doesn't block server startup
	go initIndexes(daysCol, winsCol)

	return &DB{
		Client:   client,
		Database: dbInstance,
		Days:     daysCol,
		Wins:     winsCol,
	}, nil
}

func initIndexes(daysCol, winsCol *mongo.Collection) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	// Index date uniquely on days collection
	dayIndex := mongo.IndexModel{
		Keys:    bson.M{"date": 1},
		Options: options.Index().SetUnique(true),
	}
	_, err := daysCol.Indexes().CreateOne(ctx, dayIndex)
	if err != nil {
		log.Printf("[MongoDB] Days index notice: %v", err)
	}

	// Index date and created_at on wins collection
	winIndexes := []mongo.IndexModel{
		{
			Keys: bson.M{"date": 1},
		},
		{
			Keys: bson.M{"created_at": -1},
		},
	}
	_, err = winsCol.Indexes().CreateMany(ctx, winIndexes)
	if err != nil {
		log.Printf("[MongoDB] Wins index notice: %v", err)
	}
}

func (db *DB) Close() {
	if db.Client != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = db.Client.Disconnect(ctx)
	}
}
