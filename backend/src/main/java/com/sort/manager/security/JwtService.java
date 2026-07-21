package com.sort.manager.security;

import com.sort.manager.config.AuthSecurityConfig;
import com.sort.manager.entity.HouseholdMember;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

@Service
public class JwtService {

    private final JwtEncoder encoder;
    private final Clock clock;
    private final long accessTtlSeconds;

    public JwtService(JwtEncoder encoder,
                      Clock clock,
                      @Value("${app.auth.access-ttl-seconds:900}") long accessTtlSeconds) {
        this.encoder = encoder;
        this.clock = clock;
        this.accessTtlSeconds = accessTtlSeconds;
    }

    public String issueAccessToken(HouseholdMember member) {
        Instant issuedAt = clock.instant();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(AuthSecurityConfig.ISSUER)
                .issuedAt(issuedAt)
                .expiresAt(issuedAt.plusSeconds(accessTtlSeconds))
                .subject(member.getUser().getUsername())
                .id(UUID.randomUUID().toString())
                .claim("uid", member.getUser().getId())
                .claim("hid", member.getHousehold().getId())
                .claim("role", member.getRole().name())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    public long getAccessTtlSeconds() {
        return accessTtlSeconds;
    }
}
