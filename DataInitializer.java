package com.chapterco.config;

import com.chapterco.entity.Role;
import com.chapterco.entity.User;
import com.chapterco.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@chapterco.com}")
    private String adminEmail;

    @Value("${app.admin.password:Admin@123}")
    private String adminPassword;

    @Value("${app.admin.name:Chapter Admin}")
    private String adminName;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Seed default administrator if not present
        if (!userRepository.existsByEmailIgnoreCase(adminEmail.trim())) {
            User admin = new User(
                    adminName.trim(),
                    adminEmail.trim().toLowerCase(),
                    passwordEncoder.encode(adminPassword),
                    Role.ADMIN
            );
            userRepository.save(admin);
            log.info("Initialized default development administrator: {}", adminEmail);
        }

        // Seed a sample customer account for convenient local evaluation if not present
        String sampleCustomerEmail = "customer@chapterco.com";
        if (!userRepository.existsByEmailIgnoreCase(sampleCustomerEmail)) {
            User customer = new User(
                    "Eleanor Vance",
                    sampleCustomerEmail,
                    passwordEncoder.encode("Customer@123"),
                    Role.CUSTOMER
            );
            userRepository.save(customer);
            log.info("Initialized default demo customer: {}", sampleCustomerEmail);
        }
    }
}
