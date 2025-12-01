package com.chat.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import jakarta.annotation.PostConstruct;
import java.time.Duration;

@Service
public class StorageService {

    @Value("${aws.accessKeyId}")
    private String accessKeyId;

    @Value("${aws.secretKey}")
    private String secretKey;

    @Value("${aws.region}")
    private String region;

    @Value("${aws.s3.bucketName}")
    private String bucketName;

    private S3Presigner presigner;

    @PostConstruct
    public void init() {
        presigner = S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(
                        StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKeyId, secretKey)))
                .build();
    }

    public PresignedUrlResponse generatePresignedUrl(String key, String contentType) {

        PutObjectRequest objectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(contentType)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(15))
                .putObjectRequest(objectRequest)
                .build();

        String uploadUrl = presigner.presignPutObject(presignRequest).url().toString();
        String publicUrl = String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, key);

        return new PresignedUrlResponse(uploadUrl, publicUrl, key);
    }

    public static class PresignedUrlResponse {
        private String uploadUrl;
        private String publicUrl;
        private String key;

        public PresignedUrlResponse(String uploadUrl, String publicUrl, String key) {
            this.uploadUrl = uploadUrl;
            this.publicUrl = publicUrl;
            this.key = key;
        }

        public String getUploadUrl() {
            return uploadUrl;
        }

        public String getPublicUrl() {
            return publicUrl;
        }

        public String getKey() {
            return key;
        }
    }
}
