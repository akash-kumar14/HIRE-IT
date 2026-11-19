ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_no_overlap";--> statement-breakpoint
DROP TRIGGER IF EXISTS refunds_within_payment_total ON refunds;--> statement-breakpoint
DROP FUNCTION IF EXISTS validate_refund_total();--> statement-breakpoint
DROP TRIGGER IF EXISTS ledger_transactions_have_entries ON ledger_transactions;--> statement-breakpoint
DROP FUNCTION IF EXISTS validate_ledger_transaction_has_entries();--> statement-breakpoint
DROP TRIGGER IF EXISTS ledger_transactions_balanced ON ledger_entries;--> statement-breakpoint
DROP FUNCTION IF EXISTS validate_ledger_transaction_balance();--> statement-breakpoint
DROP TRIGGER IF EXISTS ledger_entries_append_only ON ledger_entries;--> statement-breakpoint
DROP FUNCTION IF EXISTS ledger_entries_append_only();--> statement-breakpoint
DROP EXTENSION IF EXISTS btree_gist;
