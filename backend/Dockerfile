# Stage 1: Build JAR with Maven
FROM maven:3.9-eclipse-temurin-26-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests

# Stage 2: Minimal Runtime JRE
FROM eclipse-temurin:26-jre-alpine
WORKDIR /app
ENV TZ=Asia/Shanghai
RUN apk add --no-tzdata tzdata && cp /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
COPY --from=build /app/target/manager.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
