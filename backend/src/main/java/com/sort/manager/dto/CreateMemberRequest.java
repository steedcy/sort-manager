package com.sort.manager.dto;

import com.sort.manager.entity.HouseholdRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateMemberRequest(
        @NotBlank @Size(min = 3, max = 64) @Pattern(regexp = "^[a-zA-Z0-9._-]+$") String username,
        @NotBlank @Size(max = 100) String displayName,
        @NotBlank @Size(min = 10, max = 200) String password,
        @NotNull HouseholdRole role) {
}
