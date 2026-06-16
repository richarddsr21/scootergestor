-- Remove the "enterprise" plan: it was never sold, drop it from the allowed values.
ALTER TABLE companies DROP CONSTRAINT companies_plan_check;
ALTER TABLE companies ADD CONSTRAINT companies_plan_check CHECK (plan IN ('start', 'pro', 'premium'));
