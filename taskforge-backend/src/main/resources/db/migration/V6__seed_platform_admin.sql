-- Seeds a single default platform admin account so the separate admin
-- login is immediately usable in a fresh environment, exactly like the
-- Ollama/dev defaults elsewhere in this project. Change this password
-- immediately in any real deployment — see docs/06-Platform-Admin-Guide.md.
--
-- Login:    admin@taskforge.local
-- Password: ChangeMe123!
-- (bcrypt hash below, cost factor 12, generated once at build time — not
-- computed by the database, since Postgres has no bcrypt function by
-- default and correctness must match Spring Security's BCryptPasswordEncoder.)

INSERT INTO platform_admins (id, email, password_hash, full_name)
VALUES (
    gen_random_uuid(),
    'admin@taskforge.local',
    '$2b$12$V..XF.sCHM./5uy.BFEBnuG8z1ZsYmAiJmA7MntCiuhwO4QgPIx/S',
    'Platform Administrator'
);
