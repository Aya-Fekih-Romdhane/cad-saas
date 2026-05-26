package com.cadsaas.auth.domain.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AuthResponse(
    @JsonProperty("access_token") String accessToken,
    @JsonProperty("refresh_token") String refreshToken,
    UserInfo user
) {
    public record UserInfo(
        String id,
        String email,
        String firstName,
        String lastName,
        String role,
        String avatarUrl
    ) {}
}
