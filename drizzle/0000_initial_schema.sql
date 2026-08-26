CREATE TABLE "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "clerk_id" text NOT NULL,
  "name" text,
  "email" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id"),
  CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE "posts" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "content" text,
  "author_id" serial,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "posts"
  ADD CONSTRAINT "posts_author_id_users_id_fk"
  FOREIGN KEY ("author_id") REFERENCES "users"("id");
