# Docker Deployment Guide for GoTalkie-WebSocket

## Quick Start with Docker

### Option 1: Using Docker Compose (Recommended)

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

The application will be available at `http://localhost:8080`

### Option 2: Using Docker CLI

```bash
# Build the image
docker build -t gotalkie-websocket .

# Run the container
docker run -d -p 8080:8080 --name gotalkie gotalkie-websocket

# View logs
docker logs -f gotalkie

# Stop the container
docker stop gotalkie

# Remove the container
docker rm gotalkie
```

## Docker Image Details

### Multi-stage Build
The Dockerfile uses a multi-stage build for optimal image size:

1. **Builder Stage** (golang:1.21-alpine):
   - Downloads dependencies
   - Compiles Go application
   - Creates static binary

2. **Runtime Stage** (alpine:latest):
   - Only contains compiled binary
   - Includes static files (HTML/CSS/JS)
   - Minimal size (~20MB)

### Image Size Optimization
- Uses Alpine Linux (minimal base image)
- Multi-stage build (excludes Go toolchain from final image)
- Static binary compilation (no runtime dependencies)
- Only necessary files copied to final image

## Port Configuration

- **Default Port**: 8080
- **Exposed Port**: 8080

To use a different port:

```bash
# Docker run
docker run -d -p 3000:8080 --name gotalkie gotalkie-websocket

# Docker compose (edit docker-compose.yml)
ports:
  - "3000:8080"
```

## Environment Variables

Currently the application uses default configuration. You can extend it with:

```yaml
# In docker-compose.yml
environment:
  - GO_ENV=production
  - PORT=8080
  - LOG_LEVEL=info
```

## Deployment Scenarios

### Local Development
```bash
docker-compose up
```
Access at: `http://localhost:8080`

### Production Deployment

#### On Cloud VM (AWS EC2, Google Cloud, Azure, DigitalOcean)

```bash
# SSH into server
ssh user@your-server-ip

# Clone repository
git clone https://github.com/GoGoTalkie/GoTalkie-WebSocket.git
cd GoTalkie-WebSocket

# Build and run with Docker Compose
docker-compose up -d

# Configure firewall
sudo ufw allow 8080/tcp
```

Access at: `http://your-server-ip:8080`

#### With Reverse Proxy (Nginx)

1. Run Docker container on port 8080
2. Configure Nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Multiple Clients Testing

1. **Server on Computer A**:
```bash
docker-compose up -d
```

2. **Client on Computer B**:
- Open browser: `http://computer-a-ip:8080`
- Enter name: "Alice"

3. **Client on Computer C**:
- Open browser: `http://computer-a-ip:8080`
- Enter name: "Bob"

## Container Management

### View Running Containers
```bash
docker ps
```

### View Logs
```bash
# All logs
docker-compose logs

# Follow logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100
```

### Restart Container
```bash
docker-compose restart
```

### Update Application
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build
```

### Remove Everything
```bash
# Stop and remove containers
docker-compose down

# Also remove images
docker-compose down --rmi all

# Also remove volumes
docker-compose down -v
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 8080
lsof -i :8080

# Or use different port
docker run -d -p 8081:8080 gotalkie-websocket
```

### Container Won't Start
```bash
# Check logs
docker-compose logs

# Check container status
docker ps -a

# Inspect container
docker inspect gotalkie-websocket
```

### WebSocket Connection Failed
- Ensure port 8080 is open in firewall
- Check if container is running: `docker ps`
- Verify logs: `docker-compose logs`
- Test connectivity: `telnet server-ip 8080`

### Build Fails
```bash
# Clean build
docker-compose build --no-cache

# Check Dockerfile syntax
docker build --no-cache -t gotalkie .
```

## Performance Tuning

### Resource Limits
```yaml
# In docker-compose.yml
services:
  gotalkie-server:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

### Scaling
```bash
# Run multiple instances
docker-compose up -d --scale gotalkie-server=3

# Behind load balancer required for proper WebSocket handling
```

## Security Best Practices

1. **Don't run as root**: Add user in Dockerfile
```dockerfile
RUN addgroup -g 1000 gotalkie && \
    adduser -D -u 1000 -G gotalkie gotalkie
USER gotalkie
```

2. **Use specific versions**: Pin Go and Alpine versions
```dockerfile
FROM golang:1.21.5-alpine AS builder
FROM alpine:3.19
```

3. **Scan for vulnerabilities**:
```bash
docker scan gotalkie-websocket
```

4. **Use secrets for sensitive data**:
```bash
docker secret create db_password password.txt
```

## Docker Hub Deployment

### Build and Push
```bash
# Tag image
docker tag gotalkie-websocket yourusername/gotalkie-websocket:latest

# Login to Docker Hub
docker login

# Push image
docker push yourusername/gotalkie-websocket:latest
```

### Pull and Run
```bash
# On any machine with Docker
docker pull yourusername/gotalkie-websocket:latest
docker run -d -p 8080:8080 yourusername/gotalkie-websocket:latest
```

## Health Check

Add to Dockerfile:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1
```

Check health:
```bash
docker ps
# Look for (healthy) status
```

## Networking

### Connect Multiple Containers
```yaml
services:
  gotalkie-server:
    networks:
      - gotalkie-network
  
  nginx:
    networks:
      - gotalkie-network

networks:
  gotalkie-network:
    driver: bridge
```

### Custom DNS
```yaml
services:
  gotalkie-server:
    dns:
      - 8.8.8.8
      - 8.8.4.4
```

## Monitoring

### Container Stats
```bash
docker stats gotalkie-websocket
```

### Prometheus + Grafana
```yaml
services:
  gotalkie-server:
    labels:
      - "prometheus.scrape=true"
      - "prometheus.port=8080"
```

## Backup and Restore

### Export Container
```bash
docker export gotalkie > gotalkie-backup.tar
```

### Save Image
```bash
docker save gotalkie-websocket > gotalkie-image.tar
```

### Load Image
```bash
docker load < gotalkie-image.tar
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Docker Build and Push

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build Docker image
        run: docker build -t gotalkie-websocket .
      
      - name: Run tests
        run: docker run gotalkie-websocket go test ./...
      
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push yourusername/gotalkie-websocket:latest
```

## Summary

The Docker setup provides:
✅ Easy one-command deployment
✅ Consistent environment across machines
✅ Minimal image size (~20MB)
✅ Multi-stage build for optimization
✅ Production-ready configuration
✅ Easy scaling and updates
✅ Portable across cloud providers

For any issues, check the logs: `docker-compose logs -f`
