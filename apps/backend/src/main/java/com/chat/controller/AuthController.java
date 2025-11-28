package com.chat.controller;

import com.chat.dto.auth.*;
import com.chat.exception.InvalidOTPException;
import com.chat.exception.ResourceNotFoundException;
import com.chat.model.User;
import com.chat.model.enums.OTPType;
import com.chat.model.enums.UserStatus;
import com.chat.security.JwtTokenProvider;
import com.chat.service.OTPService;
import com.chat.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private OTPService otpService;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        System.out.println("Login request received for: " + loginRequest.getUsername());
        try {
            // Check if user exists first
            User user;
            try {
                user = userService.getUserByUsername(loginRequest.getUsername());
            } catch (com.chat.exception.ResourceNotFoundException e) {
                try {
                    user = userService.getUserByEmail(loginRequest.getUsername());
                } catch (com.chat.exception.ResourceNotFoundException e2) {
                    throw new com.chat.exception.InvalidCredentialsException("Account does not exist");
                }
            }

            // Check if account is active
            if (!user.getIsActive()) {
                throw new com.chat.exception.InvalidCredentialsException("Account is inactive. Please contact support.");
            }

            // Try authentication
            Authentication authentication;
            try {
                authentication = authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                loginRequest.getUsername(),
                                loginRequest.getPassword()));
            } catch (org.springframework.security.authentication.BadCredentialsException e) {
                throw new com.chat.exception.InvalidCredentialsException("Incorrect password");
            }

            System.out.println("Authentication successful for: " + loginRequest.getUsername());
            SecurityContextHolder.getContext().setAuthentication(authentication);

            String jwt = tokenProvider.generateToken(authentication);
            String refreshToken = tokenProvider.generateRefreshToken(authentication);

            User updatedUser = userService.updateUserStatus(user.getId(), UserStatus.ONLINE);

            return ResponseEntity.ok(new AuthResponse(jwt, refreshToken, updatedUser));
        } catch (com.chat.exception.InvalidCredentialsException e) {
            throw e; // Re-throw to be handled by GlobalExceptionHandler
        } catch (Exception e) {
            System.out.println("Login failed for: " + loginRequest.getUsername());
            e.printStackTrace();
            throw new com.chat.exception.InvalidCredentialsException("Login failed. Please check your credentials.");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            User user = new User();
            user.setUsername(registerRequest.getUsername());
            user.setFullName(registerRequest.getFullName());
            user.setEmail(registerRequest.getEmail());
            user.setPassword(registerRequest.getPassword());

            User result = userService.createUser(user);

            // Generate and send OTP (won't fail registration if email sending fails)
            otpService.generateAndSendOTP(result.getEmail(), OTPType.REGISTRATION);

            return ResponseEntity.ok("User registered successfully. Please check your email for verification code.");
        } catch (com.chat.exception.DuplicateResourceException e) {
            throw e; // Re-throw to be handled by GlobalExceptionHandler
        } catch (Exception e) {
            System.err.println("Registration failed: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Registration failed: " + e.getMessage());
        }
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        boolean isValid = otpService.verifyOTP(request.getEmail(), request.getCode(), OTPType.REGISTRATION);

        if (isValid) {
            userService.verifyEmailByEmail(request.getEmail());
            return ResponseEntity.ok("Email verified successfully.");
        } else {
            return ResponseEntity.badRequest().body("Invalid or expired OTP.");
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@Valid @RequestBody TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        if (tokenProvider.validateToken(requestRefreshToken)) {
            UUID userId = tokenProvider.getUserIdFromJWT(requestRefreshToken);

            // Generate new access token
            String newAccessToken = tokenProvider.generateTokenFromUserId(userId, 3600000); // 1 hour

            // Return new token (we can also rotate refresh token if we want, but for now
            // keep it simple)
            // Ideally we should return AuthResponse but we don't have the User object handy
            // without DB call
            // Let's fetch user to be consistent
            User user = userService.getUserById(userId);

            return ResponseEntity.ok(new AuthResponse(newAccessToken, requestRefreshToken, user));
        }

        return ResponseEntity.badRequest().body("Invalid refresh token");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        // Check if user exists
        try {
            userService.getUserByEmail(request.getEmail());
        } catch (ResourceNotFoundException e) {
            // Don't reveal if user exists or not for security, but for this app it's fine
            return ResponseEntity.ok("If an account exists with that email, we have sent a password reset code.");
        }

        otpService.generateAndSendOTP(request.getEmail(), OTPType.PASSWORD_RESET);
        return ResponseEntity.ok("Password reset code sent to email.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        boolean isValid = otpService.verifyOTP(request.getEmail(), request.getCode(), OTPType.PASSWORD_RESET);

        if (isValid) {
            userService.resetPassword(request.getEmail(), request.getNewPassword());
            return ResponseEntity.ok("Password reset successfully.");
        } else {
            return ResponseEntity.badRequest().body("Invalid or expired OTP.");
        }
    }
}
