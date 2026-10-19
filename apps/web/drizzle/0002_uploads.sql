CREATE TABLE "upload" (
	"id" text PRIMARY KEY NOT NULL,
	"form_id" text NOT NULL,
	"field_key" text NOT NULL,
	"response_id" text,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"size" integer NOT NULL,
	"data" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "upload" ADD CONSTRAINT "upload_form_id_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload" ADD CONSTRAINT "upload_response_id_response_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."response"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "upload_form_idx" ON "upload" USING btree ("form_id","created_at");--> statement-breakpoint
CREATE INDEX "upload_response_idx" ON "upload" USING btree ("response_id");