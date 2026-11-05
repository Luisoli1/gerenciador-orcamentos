# Estágio 1: Build da aplicação com Maven e Java 21
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# Estágio 2: Imagem final enxuta com JRE 21
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/ger-orcamentos-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

# Otimização de memória para planos gratuitos (512MB RAM)
ENV JAVA_OPTS="-XX:+UseSerialGC -Xmx320m -Xms128m -XX:MaxMetaspaceSize=128m -XX:+ExitOnOutOfMemoryError"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

