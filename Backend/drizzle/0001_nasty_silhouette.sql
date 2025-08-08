CREATE TABLE "folders" (
	"id" text PRIMARY KEY NOT NULL,
	"vault_id" text,
	"parent_id" text,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "folder_id" text;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "vaults" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "vaults" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_parent_id_folders_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_folders_vault_id" ON "folders" USING btree ("vault_id");--> statement-breakpoint
CREATE INDEX "idx_folders_parent_id" ON "folders" USING btree ("parent_id");--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_files_vault_id" ON "files" USING btree ("vault_id");--> statement-breakpoint
CREATE INDEX "idx_files_folder_id" ON "files" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "idx_vaults_owner_id" ON "vaults" USING btree ("owner_id");