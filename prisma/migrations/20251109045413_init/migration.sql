-- CreateTable
CREATE TABLE "ProposalVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "marketAddress" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vote" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ResolutionVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "marketAddress" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vote" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "marketAddress" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL DEFAULT 'general',
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CommentVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vote" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MarketMetadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "description" TEXT,
    "creator" TEXT NOT NULL,
    "state" INTEGER NOT NULL,
    "expiryTime" BIGINT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "marketAddress" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "ProposalVote_marketAddress_idx" ON "ProposalVote"("marketAddress");

-- CreateIndex
CREATE INDEX "ProposalVote_userId_idx" ON "ProposalVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalVote_marketAddress_userId_key" ON "ProposalVote"("marketAddress", "userId");

-- CreateIndex
CREATE INDEX "ResolutionVote_marketAddress_idx" ON "ResolutionVote"("marketAddress");

-- CreateIndex
CREATE INDEX "ResolutionVote_userId_idx" ON "ResolutionVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ResolutionVote_marketAddress_userId_key" ON "ResolutionVote"("marketAddress", "userId");

-- CreateIndex
CREATE INDEX "Comment_marketAddress_idx" ON "Comment"("marketAddress");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

-- CreateIndex
CREATE INDEX "Comment_timestamp_idx" ON "Comment"("timestamp");

-- CreateIndex
CREATE INDEX "CommentVote_commentId_idx" ON "CommentVote"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentVote_commentId_userId_key" ON "CommentVote"("commentId", "userId");

-- CreateIndex
CREATE INDEX "MarketMetadata_state_idx" ON "MarketMetadata"("state");

-- CreateIndex
CREATE INDEX "MarketMetadata_creator_idx" ON "MarketMetadata"("creator");

-- CreateIndex
CREATE INDEX "UserActivity_userId_idx" ON "UserActivity"("userId");

-- CreateIndex
CREATE INDEX "UserActivity_marketAddress_idx" ON "UserActivity"("marketAddress");

-- CreateIndex
CREATE INDEX "UserActivity_timestamp_idx" ON "UserActivity"("timestamp");
