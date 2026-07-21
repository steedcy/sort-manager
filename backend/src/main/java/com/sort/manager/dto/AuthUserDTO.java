package com.sort.manager.dto;

public record AuthUserDTO(
        Long id,
        String username,
        String displayName,
        Long householdId,
        String householdName,
        String role) {
}
