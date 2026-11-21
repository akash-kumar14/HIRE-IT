CREATE TABLE "rate_limit_counters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" text NOT NULL,
	"subject" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "rate_limit_counters_scope_subject_window_unique" ON "rate_limit_counters" USING btree ("scope","subject","window_start");--> statement-breakpoint
CREATE INDEX "rate_limit_counters_window_start_idx" ON "rate_limit_counters" USING btree ("window_start");