package com.sort.manager.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        long expiresIn,
        AuthUserDTO user) {
}
