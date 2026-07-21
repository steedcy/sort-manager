package com.sort.manager.dto;

public record MemberDTO(
        Long id,
        Long userId,
        String username,
        String displayName,
        String role,
        boolean enabled,
        String createdAt) {
}
