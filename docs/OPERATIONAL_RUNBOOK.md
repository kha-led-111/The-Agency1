# The Agency — Operational Runbook

**Document Version:** 1.0.0  
**Target Environment:** Production  
**Owner:** DevOps & Operations Team  

---

## 1. System Health Monitoring & SLA Thresholds

### Health Check Endpoints
- **Liveness Probe**: `GET /health/live`
  - Returns `200 OK` ("Healthy") when HTTP server and process are running.
  - Used by Kubernetes/Docker containers to check container viability.
- **Readiness Probe**: `GET /health/ready`
  - Returns `200 OK` ("Healthy") when PostgreSQL database and Redis connections are established.
  - Returns `530 Service Unavailable` if database queries fail.

### Operational Alert Thresholds (SLAs)
| Metric | Threshold | Action Triggered |
| :--- | :--- | :--- |
| **API Latency (p95)** | > 200ms over 5m window | Alert Ops: Check DB connection pool & slow queries |
| **HTTP 5xx Error Rate** | > 0.1% of total requests | P1 Incident: Trigger automatic failover & inspect log stream |
| **Database Pool Exhaus.** | > 85% active connections | Alert Ops: Investigate connection leaks or scale DB pool |
| **CPU Utilization** | > 80% sustained for 5m | Trigger horizontal container auto-scaling (HPA) |
| **Memory Utilization** | > 85% sustained for 5m | Container restart / memory limit adjustment |

---

## 2. Database Backup & Disaster Recovery

### Automated Backup Schedule
- **Daily Full Backup**: Executed at `02:00 UTC` using `pg_dump`.
- **Retention Period**: Daily backups kept for 30 days; weekly backups kept for 1 year.

### Executing Manual Backup
```bash
pg_dump -h <DB_HOST> -U <DB_USER> -d theagency -F c -b -v -f "/backups/theagency_$(date +%Y%m%m_%H%M%S).dump"
```

### Database Restoration Procedure
1. Stop backend application containers to prevent active mutations:
   ```bash
   docker-compose -f docker-compose.yml stop backend
   ```
2. Restore database from `.dump` snapshot:
   ```bash
   pg_restore -h <DB_HOST> -U <DB_USER> -d theagency --clean --if-exists -v "/backups/theagency_TARGET.dump"
   ```
3. Run verification queries to check data consistency:
   ```sql
   SELECT COUNT(*) FROM "Users";
   SELECT COUNT(*) FROM "Orders";
   ```
4. Restart backend services:
   ```bash
   docker-compose -f docker-compose.yml start backend
   ```

---

## 3. Database Migration & Rollback Strategy

### Zero-Downtime Migration Process
1. **Schema Modifications**: Ensure all schema additions are backward-compatible (nullable columns or columns with defaults; non-breaking index creation).
2. **Apply Migration**:
   Generate SQL script from EF Core migration prior to deployment:
   ```bash
   dotnet ef migrations script -i -o migration.sql --project backend/src/TheAgency.Infrastructure --startup-project backend/src/TheAgency.Api
   ```
3. Executing script against production PostgreSQL instance:
   ```bash
   psql -h <DB_HOST> -U <DB_USER> -d theagency -f migration.sql
   ```
4. Deploy new application container image once migration succeeds.

### Rollback Procedure
If a database migration fails or causes application regression:
1. Roll back the application container to the previous stable release tag:
   ```bash
   docker rollout undo deployment/theagency-backend
   ```
2. Revert EF Core migration state (if migration script supports rollback):
   ```bash
   dotnet ef database update <PREVIOUS_MIGRATION_NAME> --project backend/src/TheAgency.Infrastructure --startup-project backend/src/TheAgency.Api
   ```

---

## 4. Secret Rotation Protocol

### Rotating JWT Signing Secret
1. Prepare new 64-character HMAC-SHA256 secret key.
2. Update key configuration in secret store (e.g. AWS Secrets Manager or Environment File).
3. Restart application instances sequentially (Rolling Restart). Active user JWTs valid under previous key will expire within 15 minutes and automatically refresh using stored Refresh Tokens.

### Rotating PostgreSQL Database Credentials
1. Update database user password in PostgreSQL server:
   ```sql
   ALTER USER agency_prod WITH PASSWORD 'NewStrongPassword123!';
   ```
2. Update `ConnectionStrings__DefaultConnection` environment variable across backend services.
3. Perform zero-downtime rolling restart of backend containers.

---

## 5. Emergency Incident Response

1. **Service Down / Unresponsive**:
   - Check health probes: `curl http://localhost:5184/health/ready`
   - Inspect container logs: `docker logs --tail 100 -f theagency-backend-1`
2. **High Latency / DB Locking**:
   - Query active PostgreSQL processes:
     ```sql
     SELECT pid, age(clock_timestamp(), query_start), usename, query 
     FROM pg_stat_activity 
     WHERE state != 'idle' ORDER BY age(clock_timestamp(), query_start) DESC;
     ```
   - Cancel long-running blocking query: `SELECT pg_cancel_backend(PID);`
