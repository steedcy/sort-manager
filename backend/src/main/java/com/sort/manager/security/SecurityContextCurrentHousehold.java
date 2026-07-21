package com.sort.manager.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class SecurityContextCurrentHousehold implements CurrentHousehold {

    @Override
    public Long requireHouseholdId() {
        return requireLongClaim("hid");
    }

    @Override
    public Long requireUserId() {
        return requireLongClaim("uid");
    }

    private Long requireLongClaim(String name) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!(authentication instanceof JwtAuthenticationToken jwtAuthentication) || !authentication.isAuthenticated()) {
            throw new IllegalStateException("Authenticated user context is required");
        }
        Object claim = jwtAuthentication.getTokenAttributes().get(name);
        return Optional.ofNullable(claim)
                .map(this::toLong)
                .orElseThrow(() -> new IllegalStateException("Authenticated token is missing claim: " + name));
    }

    private Long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        try {
            return Long.valueOf(value.toString());
        } catch (NumberFormatException exception) {
            throw new IllegalStateException("Authenticated token contains an invalid identifier", exception);
        }
    }
}
