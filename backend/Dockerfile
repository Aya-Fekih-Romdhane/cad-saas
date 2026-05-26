# Multi-stage build
FROM maven:3.9.5-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn package -DskipTests -q

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

RUN useradd -r -u 1001 -g root appuser
RUN mkdir -p /app/uploads && chown appuser /app/uploads

COPY --from=builder /app/target/*.jar app.jar
USER appuser

EXPOSE 8080

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-jar", "app.jar"]
