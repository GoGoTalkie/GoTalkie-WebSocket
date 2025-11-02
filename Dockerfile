# Multi-stage Dockerfile that builds the React (Vite) frontend and the Go server

########## Frontend build stage (Node) ##########
FROM node:20-alpine AS node_builder
WORKDIR /app/client

# Install build dependencies
COPY client/package.json client/package-lock.json* ./
RUN npm ci --silent

# Copy frontend source and build
COPY client/ ./
RUN npm run build


########## Go build stage ##########
FROM golang:1.24.3-alpine AS go_builder
RUN apk add --no-cache git ca-certificates
WORKDIR /app

# Copy go module files and download
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source (including cmd/, server/, etc.)
COPY . .

# Build the Go server (static binary)
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags "-w -s" -o bin/server ./cmd/server


########## Final runtime stage (distroless) ##########
FROM gcr.io/distroless/static-debian12:nonroot

# Copy CA certs from builder so HTTPS works
COPY --from=go_builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Create app directory and copy server binary
COPY --from=go_builder --chown=nonroot:nonroot /app/bin/server /app/server

# Copy built frontend into the location the Go server expects (client/dist)
COPY --from=node_builder --chown=nonroot:nonroot /app/client/dist /app/client/dist

# Fallback static (if any)
COPY --from=go_builder --chown=nonroot:nonroot /app/static /app/static

USER nonroot:nonroot
WORKDIR /app
EXPOSE 8080
ENTRYPOINT ["/app/server"]
