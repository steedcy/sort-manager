package com.sort.manager.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateMemberEnabledRequest(@NotNull Boolean enabled) {
}
