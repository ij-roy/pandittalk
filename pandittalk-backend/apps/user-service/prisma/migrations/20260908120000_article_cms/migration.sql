-- AlterTable
CREATE TYPE "ArticleStatus" AS ENUM ('draft', 'scheduled', 'published', 'unpublished');
CREATE TYPE "ArticleLanguage" AS ENUM ('hi', 'en', 'mixed');
CREATE TYPE "ArticleEventType" AS ENUM ('view', 'read', 'cta_click');
CREATE TYPE "ArticleEventSource" AS ENUM ('app', 'web');

ALTER TABLE "articles"
  ADD COLUMN "author_pandit_id" UUID,
  ADD COLUMN "status" "ArticleStatus" NOT NULL DEFAULT 'draft',
  ADD COLUMN "language" "ArticleLanguage" NOT NULL DEFAULT 'mixed',
  ADD COLUMN "cover_alt" TEXT,
  ADD COLUMN "seo_title" TEXT,
  ADD COLUMN "seo_description" TEXT,
  ADD COLUMN "scheduled_at" TIMESTAMPTZ(6),
  ADD COLUMN "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "articles"
SET
  "status" = 'published',
  "updated_at" = COALESCE("created_at", CURRENT_TIMESTAMP);

CREATE INDEX "articles_status_published_at_idx" ON "articles"("status", "published_at" DESC);
CREATE INDEX "articles_author_pandit_id_idx" ON "articles"("author_pandit_id");

ALTER TABLE "articles"
  ADD CONSTRAINT "articles_author_pandit_id_fkey"
  FOREIGN KEY ("author_pandit_id") REFERENCES "pandits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "article_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "article_id" UUID NOT NULL,
  "type" "ArticleEventType" NOT NULL,
  "source" "ArticleEventSource" NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "article_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "article_events_article_id_type_created_at_idx"
  ON "article_events"("article_id", "type", "created_at" DESC);

ALTER TABLE "article_events"
  ADD CONSTRAINT "article_events_article_id_fkey"
  FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
