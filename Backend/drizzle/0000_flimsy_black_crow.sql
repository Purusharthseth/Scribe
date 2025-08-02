CREATE TABLE "files" (
	"id" text PRIMARY KEY NOT NULL,
	"vault_id" text,
	"name" text NOT NULL,
	"content" text
);
--> statement-breakpoint
CREATE TABLE "vaults" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"file_tree" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"share_mode" text DEFAULT 'private',
	"share_token" text,
	CONSTRAINT "vaults_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE cascade ON UPDATE no action;