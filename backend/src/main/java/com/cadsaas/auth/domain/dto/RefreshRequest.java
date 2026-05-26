package com.cadsaas.auth.domain.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record RefreshRequest(
    @JsonProperty("refresh_token") String refreshToken
) {}
