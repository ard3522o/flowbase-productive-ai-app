CREATE TABLE "generated_apps" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"app_name" text NOT NULL,
	"description" text DEFAULT '',
	"icon" text DEFAULT 'Sparkles',
	"color" text DEFAULT '#7C3AED',
	"layout" text DEFAULT 'single-page',
	"sections" jsonb DEFAULT '[]'::jsonb,
	"actions" jsonb DEFAULT '[]'::jsonb,
	"sample_data" jsonb DEFAULT '[]'::jsonb,
	"app_data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
