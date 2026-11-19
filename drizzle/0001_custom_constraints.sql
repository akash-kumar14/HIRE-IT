CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_no_overlap" EXCLUDE USING gist ("provider_profile_id" WITH =, tstzrange("scheduled_start", "scheduled_end", '[)') WITH &&) WHERE ("status" in ('confirmed', 'in_progress'));--> statement-breakpoint
CREATE FUNCTION ledger_entries_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'ledger_entries are append-only';
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER ledger_entries_append_only BEFORE UPDATE OR DELETE ON ledger_entries FOR EACH ROW EXECUTE FUNCTION ledger_entries_append_only();--> statement-breakpoint
CREATE FUNCTION validate_ledger_transaction_balance() RETURNS trigger AS $$
DECLARE
  debit_total bigint;
  credit_total bigint;
  currency_count integer;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN direction = 'debit' THEN amount_minor_units ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount_minor_units ELSE 0 END), 0),
    COUNT(DISTINCT currency)
  INTO debit_total, credit_total, currency_count
  FROM ledger_entries
  WHERE transaction_id = NEW.transaction_id;

  IF debit_total = 0 OR debit_total <> credit_total OR currency_count <> 1 THEN
    RAISE EXCEPTION 'ledger transaction must have balanced debit and credit entries in one currency';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE CONSTRAINT TRIGGER ledger_transactions_balanced AFTER INSERT ON ledger_entries DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validate_ledger_transaction_balance();--> statement-breakpoint
CREATE FUNCTION validate_ledger_transaction_has_entries() RETURNS trigger AS $$
DECLARE
  entry_count integer;
BEGIN
  SELECT COUNT(*) INTO entry_count FROM ledger_entries WHERE transaction_id = NEW.id;

  IF entry_count < 2 THEN
    RAISE EXCEPTION 'ledger transaction must have at least two entries';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE CONSTRAINT TRIGGER ledger_transactions_have_entries AFTER INSERT ON ledger_transactions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validate_ledger_transaction_has_entries();--> statement-breakpoint
CREATE FUNCTION validate_refund_total() RETURNS trigger AS $$
DECLARE
  payment_amount integer;
  payment_currency text;
  refund_total bigint;
BEGIN
  SELECT amount_minor_units, currency INTO payment_amount, payment_currency FROM payments WHERE id = NEW.payment_id;

  IF NEW.currency <> payment_currency THEN
    RAISE EXCEPTION 'refund currency must match payment currency';
  END IF;

  SELECT COALESCE(SUM(amount_minor_units), 0) INTO refund_total
  FROM refunds
  WHERE payment_id = NEW.payment_id AND status = 'completed';

  IF refund_total > payment_amount THEN
    RAISE EXCEPTION 'completed refunds cannot exceed payment amount';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE CONSTRAINT TRIGGER refunds_within_payment_total AFTER INSERT OR UPDATE OF status, amount_minor_units ON refunds DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validate_refund_total();
