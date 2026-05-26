package com.cadsaas.auth.service;

import com.cadsaas.auth.domain.dto.*;
import com.cadsaas.auth.domain.entity.RefreshToken;
import com.cadsaas.auth.domain.repository.RefreshTokenRepository;
import com.cadsaas.common.enums.AuthProvider;
import com.cadsaas.common.enums.Role;
import com.cadsaas.common.exception.BusinessException;
import com.cadsaas.security.jwt.JwtService;
import com.cadsaas.user.domain.entity.User;
import com.cadsaas.user.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Value("${application.security.jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException("Email already registered");
        }

        User user = User.builder()
            .email(request.email())
            .password(passwordEncoder.encode(request.password()))
            .firstName(request.firstName())
            .lastName(request.lastName())
            .role(Role.USER)
            .provider(AuthProvider.LOCAL)
            .isActive(true)
            .isVerified(false)
            .build();

        userRepository.save(user);
        log.info("New user registered: {}", user.getEmail());
        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );
        User user = userRepository.findByEmail(request.email())
            .orElseThrow(() -> new BusinessException("User not found"));
        return buildAuthResponse(user);
    }

    public AuthResponse refreshToken(String refreshTokenValue) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenValue)
            .orElseThrow(() -> new BusinessException("Invalid refresh token"));

        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new BusinessException("Refresh token expired. Please login again.");
        }

        User user = refreshToken.getUser();
        String newAccessToken = jwtService.generateAccessToken(buildClaims(user), user);
        return new AuthResponse(newAccessToken, refreshTokenValue, toUserInfo(user));
    }

    public void logout(String refreshTokenValue) {
        refreshTokenRepository.findByToken(refreshTokenValue)
            .ifPresent(refreshTokenRepository::delete);
    }

    private AuthResponse buildAuthResponse(User user) {
        Map<String, Object> claims = buildClaims(user);
        String accessToken = jwtService.generateAccessToken(claims, user);
        String refreshTokenValue = createRefreshToken(user);
        return new AuthResponse(accessToken, refreshTokenValue, toUserInfo(user));
    }

    private String createRefreshToken(User user) {
        // Revoke old tokens
        refreshTokenRepository.deleteByUser(user);

        RefreshToken token = RefreshToken.builder()
            .token(UUID.randomUUID().toString())
            .user(user)
            .expiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpiration / 1000))
            .build();

        return refreshTokenRepository.save(token).getToken();
    }

    private Map<String, Object> buildClaims(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole().name());
        claims.put("userId", user.getId().toString());
        return claims;
    }

    private AuthResponse.UserInfo toUserInfo(User user) {
        return new AuthResponse.UserInfo(
            user.getId().toString(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getRole().name(),
            user.getAvatarUrl()
        );
    }
}
