package com.chat.exception;

import com.chat.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler for all REST controllers
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

        /**
         * Handle ResourceNotFoundException
         */
        @ExceptionHandler(ResourceNotFoundException.class)
        public ResponseEntity<ErrorResponse> handleResourceNotFound(
                        ResourceNotFoundException ex,
                        HttpServletRequest request) {

                ErrorResponse error = new ErrorResponse(
                                HttpStatus.NOT_FOUND.value(),
                                "Not Found",
                                ex.getMessage(),
                                request.getRequestURI());

                return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
        }

        /**
         * Handle DuplicateResourceException
         */
        @ExceptionHandler(DuplicateResourceException.class)
        public ResponseEntity<ErrorResponse> handleDuplicateResource(
                        DuplicateResourceException ex,
                        HttpServletRequest request) {

                ErrorResponse error = new ErrorResponse(
                                HttpStatus.CONFLICT.value(),
                                "Conflict",
                                ex.getMessage(),
                                request.getRequestURI());

                return new ResponseEntity<>(error, HttpStatus.CONFLICT);
        }

        /**
         * Handle InvalidCredentialsException
         */
        @ExceptionHandler(InvalidCredentialsException.class)
        public ResponseEntity<ErrorResponse> handleInvalidCredentials(
                        InvalidCredentialsException ex,
                        HttpServletRequest request) {

                ErrorResponse error = new ErrorResponse(
                                HttpStatus.UNAUTHORIZED.value(),
                                "Unauthorized",
                                ex.getMessage(),
                                request.getRequestURI());

                return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
        }

        /**
         * Handle InvalidOTPException
         */
        @ExceptionHandler(InvalidOTPException.class)
        public ResponseEntity<ErrorResponse> handleInvalidOTP(
                        InvalidOTPException ex,
                        HttpServletRequest request) {

                ErrorResponse error = new ErrorResponse(
                                HttpStatus.BAD_REQUEST.value(),
                                "Bad Request",
                                ex.getMessage(),
                                request.getRequestURI());

                return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        }

        /**
         * Handle UnauthorizedException
         */
        @ExceptionHandler(UnauthorizedException.class)
        public ResponseEntity<ErrorResponse> handleUnauthorized(
                        UnauthorizedException ex,
                        HttpServletRequest request) {

                ErrorResponse error = new ErrorResponse(
                                HttpStatus.FORBIDDEN.value(),
                                "Forbidden",
                                ex.getMessage(),
                                request.getRequestURI());

                return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
        }

        /**
         * Handle BusinessException
         */
        @ExceptionHandler(BusinessException.class)
        public ResponseEntity<ErrorResponse> handleBusinessException(
                        BusinessException ex,
                        HttpServletRequest request) {

                ErrorResponse error = new ErrorResponse(
                                HttpStatus.BAD_REQUEST.value(),
                                "Bad Request",
                                ex.getMessage(),
                                request.getRequestURI());

                return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        }

        /**
         * Handle RateLimitExceededException
         */
        @ExceptionHandler(RateLimitExceededException.class)
        public ResponseEntity<ErrorResponse> handleRateLimitExceeded(
                        RateLimitExceededException ex,
                        HttpServletRequest request) {

                ErrorResponse error = new ErrorResponse(
                                HttpStatus.TOO_MANY_REQUESTS.value(),
                                "Too Many Requests",
                                ex.getMessage(),
                                request.getRequestURI());

                return new ResponseEntity<>(error, HttpStatus.TOO_MANY_REQUESTS);
        }

        /**
         * Handle validation errors
         */
        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<Map<String, Object>> handleValidationErrors(
                        MethodArgumentNotValidException ex,
                        HttpServletRequest request) {

                Map<String, String> errors = new HashMap<>();
                ex.getBindingResult().getAllErrors().forEach((error) -> {
                        String fieldName = ((FieldError) error).getField();
                        String errorMessage = error.getDefaultMessage();
                        errors.put(fieldName, errorMessage);
                });

                Map<String, Object> response = new HashMap<>();
                response.put("timestamp", java.time.LocalDateTime.now());
                response.put("status", HttpStatus.BAD_REQUEST.value());
                response.put("error", "Validation Failed");
                response.put("message", "Invalid input data");
                response.put("errors", errors);
                response.put("path", request.getRequestURI());

                return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }

        /**
         * Handle all other exceptions
         */
        @ExceptionHandler(Exception.class)
        public ResponseEntity<ErrorResponse> handleGlobalException(
                        Exception ex,
                        HttpServletRequest request) {

                ErrorResponse error = new ErrorResponse(
                                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                                "Internal Server Error",
                                "An unexpected error occurred: " + ex.getMessage(),
                                request.getRequestURI());

                // Print stack trace for debugging
                ex.printStackTrace();

                return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
}
