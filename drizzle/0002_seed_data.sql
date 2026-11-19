INSERT INTO service_categories (id, name, slug, description, sort_order) VALUES
  ('10000000-0000-4000-8000-000000000001', 'Home Cleaning', 'home-cleaning', 'Home and kitchen cleaning services', 10),
  ('10000000-0000-4000-8000-000000000002', 'Plumbing', 'plumbing', 'Pipe, tap, and drainage repairs', 20),
  ('10000000-0000-4000-8000-000000000003', 'Electrical Repair', 'electrical-repair', 'Wiring, switches, fan, and light repairs', 30),
  ('10000000-0000-4000-8000-000000000004', 'Tutoring', 'tutoring', 'Academic and language tutoring', 40),
  ('10000000-0000-4000-8000-000000000005', 'Appliance Repair', 'appliance-repair', 'Home appliance diagnostics and repair', 50),
  ('10000000-0000-4000-8000-000000000006', 'Painting', 'painting', 'Interior and exterior painting', 60),
  ('10000000-0000-4000-8000-000000000007', 'Gardening', 'gardening', 'Lawn, plant, and garden care', 70),
  ('10000000-0000-4000-8000-000000000008', 'Moving Help', 'moving-help', 'Packing and furniture moving assistance', 80)
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO skills (id, category_id, name, slug, description) VALUES
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Deep Cleaning', 'deep-cleaning', 'Whole-home deep cleaning'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Kitchen Cleaning', 'kitchen-cleaning', 'Kitchen deep cleaning and degreasing'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 'Pipe Repair', 'pipe-repair', 'Leak and pipe repair'),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002', 'Tap Installation', 'tap-installation', 'Faucet and tap installation'),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000003', 'Wiring Repair', 'wiring-repair', 'Electrical wiring fault repair'),
  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000003', 'Fan Installation', 'fan-installation', 'Ceiling and exhaust fan installation'),
  ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000004', 'Math Tutoring', 'math-tutoring', 'School-level mathematics tutoring'),
  ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000004', 'English Tutoring', 'english-tutoring', 'English language and literature tutoring'),
  ('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000005', 'Fridge Repair', 'fridge-repair', 'Refrigerator diagnostics and repair'),
  ('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000005', 'Washing Machine Repair', 'washing-machine-repair', 'Washing machine diagnostics and repair'),
  ('20000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000006', 'Wall Painting', 'wall-painting', 'Interior wall painting'),
  ('20000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000006', 'Furniture Painting', 'furniture-painting', 'Furniture refinishing and painting'),
  ('20000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000007', 'Lawn Mowing', 'lawn-mowing', 'Lawn trimming and mowing'),
  ('20000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000007', 'Plant Care', 'plant-care', 'Plant watering, pruning, and maintenance'),
  ('20000000-0000-4000-8000-000000000015', '10000000-0000-4000-8000-000000000008', 'Packing', 'packing', 'Packing household goods for moving'),
  ('20000000-0000-4000-8000-000000000016', '10000000-0000-4000-8000-000000000008', 'Furniture Moving', 'furniture-moving', 'Safe furniture lifting and moving')
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO verification_requirements (id, category_id, name, description, document_type, is_required, validity_months) VALUES
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Identity Proof', 'Government-issued identity proof', 'identity_document', true, 60),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Identity Proof', 'Government-issued identity proof', 'identity_document', true, 60),
  ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 'Plumbing Skill Certificate', 'Relevant plumbing training or experience proof', 'skill_certificate', false, 36),
  ('30000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000003', 'Identity Proof', 'Government-issued identity proof', 'identity_document', true, 60),
  ('30000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000003', 'Electrical Safety Certificate', 'Electrical safety or trade certificate', 'skill_certificate', true, 24),
  ('30000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000004', 'Identity Proof', 'Government-issued identity proof', 'identity_document', true, 60),
  ('30000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000004', 'Teaching Qualification', 'Academic or teaching qualification proof', 'skill_certificate', false, null),
  ('30000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000005', 'Identity Proof', 'Government-issued identity proof', 'identity_document', true, 60),
  ('30000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000006', 'Identity Proof', 'Government-issued identity proof', 'identity_document', true, 60),
  ('30000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000007', 'Identity Proof', 'Government-issued identity proof', 'identity_document', true, 60)
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO platform_settings (id, key, value_type, value, description, is_public) VALUES
  ('40000000-0000-4000-8000-000000000001', 'matching.ranking_weights.v1', 'json', '{"availability":15,"distance":25,"rating":20,"verification":25,"price":15}'::jsonb, 'Initial matching weights', false),
  ('40000000-0000-4000-8000-000000000002', 'commission.default_policy', 'json', '{"rateBasisPoints":1000,"policyVersion":"v1"}'::jsonb, 'Default provider commission policy', false),
  ('40000000-0000-4000-8000-000000000003', 'payments.simulator_enabled', 'boolean', 'true'::jsonb, 'Payment simulator availability', false),
  ('40000000-0000-4000-8000-000000000004', 'support.contact_email', 'string', '"support@hire-it.local"'::jsonb, 'Support contact address', true)
ON CONFLICT DO NOTHING;
