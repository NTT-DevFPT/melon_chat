package com.chat;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.io.File;

@SpringBootApplication
@EnableJpaAuditing
public class ChatApplication {

    public static void main(String[] args) {
        // Try to load .env from apps/backend if running from root
        String envPath = ".";
        if (new File("apps/backend/.env").exists()) {
            envPath = "apps/backend";
        }

        try {
            Dotenv dotenv = Dotenv.configure()
                    .directory(envPath)
                    .ignoreIfMissing()
                    .load();

            dotenv.entries().forEach(entry -> {
                System.setProperty(entry.getKey(), entry.getValue());
            });
        } catch (Exception e) {
            System.out.println("Could not load .env file: " + e.getMessage());
        }

        SpringApplication.run(ChatApplication.class, args);
    }
}
