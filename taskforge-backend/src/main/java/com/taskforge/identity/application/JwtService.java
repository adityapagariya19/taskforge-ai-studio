package com.taskforge.identity.application;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey key;
    private final long accessTokenMinutes;

    public JwtService(
            @Value("${taskforge.jwt.secret}") String secret,
            @Value("${taskforge.jwt.access-token-minutes}") long accessTokenMinutes) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.accessTokenMinutes = accessTokenMinutes;
    }

    /** Identity-only token: who you are, no organization context yet. Used between login and org activation. */
    public String generateAccessToken(UUID userId, String email) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(accessTokenMinutes, ChronoUnit.MINUTES)))
                .signWith(key)
                .compact();
    }

    /**
     * Organization-scoped token: everything a request needs to authorize
     * itself against one specific organization without a DB round trip per
     * request. permissionCodes is a snapshot of the member's role's grants
     * at activation time; switching organizations (re-calling activate) or
     * a future "refresh my permissions" endpoint is how it stays current
     * after a role change.
     */
    public String generateOrgScopedToken(UUID userId, String email, UUID organizationId,
                                          UUID organizationMemberId, String roleCode,
                                          List<String> permissionCodes) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("orgId", organizationId.toString())
                .claim("orgMemberId", organizationMemberId.toString())
                .claim("roleCode", roleCode)
                .claim("perms", permissionCodes)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(accessTokenMinutes, ChronoUnit.MINUTES)))
                .signWith(key)
                .compact();
    }

    /**
     * Platform admin token: structurally distinct from every other token
     * this service issues via the "type" claim. JwtAuthFilter checks this
     * claim before trusting a token for platform-admin-only endpoints — a
     * regular user or org-scoped token can never pass that check, even if
     * someone tried to forge matching field names, because "type" is set
     * here and nowhere else.
     */
    public String generatePlatformAdminToken(UUID adminId, String email) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(adminId.toString())
                .claim("email", email)
                .claim("type", "PLATFORM_ADMIN")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(accessTokenMinutes, ChronoUnit.MINUTES)))
                .signWith(key)
                .compact();
    }

    public boolean isPlatformAdminToken(String token) {
        return "PLATFORM_ADMIN".equals(claims(token).get("type", String.class));
    }

    public UUID extractUserId(String token) {
        return UUID.fromString(claims(token).getSubject());
    }

    public boolean isValid(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isOrgScoped(String token) {
        return claims(token).get("orgId") != null;
    }

    public UUID extractOrganizationId(String token) {
        String v = claims(token).get("orgId", String.class);
        return v == null ? null : UUID.fromString(v);
    }

    public UUID extractOrganizationMemberId(String token) {
        String v = claims(token).get("orgMemberId", String.class);
        return v == null ? null : UUID.fromString(v);
    }

    public String extractRoleCode(String token) {
        return claims(token).get("roleCode", String.class);
    }

    @SuppressWarnings("unchecked")
    public List<String> extractPermissionCodes(String token) {
        Object raw = claims(token).get("perms");
        return raw == null ? List.of() : (List<String>) raw;
    }

    private Claims claims(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
