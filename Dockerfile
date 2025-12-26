# ============================================
# DOCKERFILE FOR E-COMMERCE APPLICATION
# ============================================
# This Dockerfile creates a container image for
# the Spring Boot E-Commerce CLI Application
# ============================================

# --------------------------------------------
# STAGE 1: BUILD STAGE
# --------------------------------------------
# Use Maven with JDK 17 to build the application
FROM maven:3.9.6-eclipse-temurin-17 AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy the Maven project files
# (pom.xml first for better Docker layer caching)
COPY pom.xml .

# Download dependencies (cached if pom.xml doesn't change)
RUN mvn dependency:go-offline -B

# Copy the source code
COPY src ./src

# Build the application (skip tests for faster build)
RUN mvn clean package -DskipTests

# --------------------------------------------
# STAGE 2: RUNTIME STAGE
# --------------------------------------------
# Use a lightweight JDK 17 runtime image
FROM eclipse-temurin:17-jre-alpine

# Set the working directory
WORKDIR /app

# Add labels for documentation
LABEL maintainer="E-Commerce Team"
LABEL version="1.0.0"
LABEL description="E-Commerce CLI Application with Spring Boot"

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy the built JAR file from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Change ownership to non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose the application port
EXPOSE 8080

# Set JVM options for container environment
ENV JAVA_OPTS="-Xmx512m -Xms256m"

# Health check to verify application is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

