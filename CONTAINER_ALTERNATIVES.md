# Container Alternatives to Docker for AnglerPhish

## Overview

While Docker is the most popular container platform, AnglerPhish can be built and deployed using several alternative container systems. This guide provides complete configurations and instructions for each alternative.

## 🐳 Why Use Docker Alternatives?

| Reason | Docker Alternative Benefits |
|--------|---------------------------|
| **Corporate Restrictions** | Some organizations restrict Docker usage |
| **Security Requirements** | Rootless containers, better isolation |
| **Performance** | Some alternatives have lower overhead |
| **Licensing** | Avoid Docker Desktop licensing for commercial use |
| **Ecosystem Integration** | Better integration with specific platforms (K8s, RHEL) |
| **Development Preferences** | Different workflow preferences |

## 📋 Quick Comparison

| Tool | Type | Best For | Dockerfile Compatible | Compose Support |
|------|------|----------|----------------------|----------------|
| **Docker** | Full Platform | General use, development | ✅ Native | ✅ Native |
| **Podman** | Daemonless Engine | Rootless, security-focused | ✅ 100% | ✅ podman-compose |
| **Buildah** | Build Tool Only | CI/CD, scriptable builds | ✅ Via buildah-bud | ❌ Build only |
| **nerdctl+containerd** | Docker-like CLI | Kubernetes, enterprise | ✅ Compatible | ✅ Limited |
| **Lima** | VM + Container | macOS development | ✅ Via Docker/Podman | ✅ Via Docker/Podman |
| **Kubernetes** | Orchestration | Production, scaling | ✅ Via BuildKit | ❌ Native K8s resources |

## 🚀 Installation & Usage

### 1. Podman (Recommended Alternative)

**Installation:**
```bash
# macOS
brew install podman

# Ubuntu/Debian
sudo apt-get install podman

# RHEL/CentOS
sudo dnf install podman
```

**Usage:**
```bash
# Method 1: Using provided script
./container-alternatives/podman-build.sh

# Method 2: Using podman-compose
cd container-alternatives
podman-compose -f podman-compose.yml up -d

# Method 3: Manual commands
podman build -t anglerphish:latest .
podman run -d --name anglerphish -p 5000:5000 --env-file .env anglerphish:latest
```

**Benefits:**
- ✅ 100% Docker CLI compatible
- ✅ Rootless containers by default
- ✅ No daemon required
- ✅ Better security model
- ✅ Works with existing Dockerfiles

### 2. Buildah (Build-Focused)

**Installation:**
```bash
# macOS
brew install buildah

# Ubuntu/Debian
sudo apt-get install buildah

# RHEL/CentOS
sudo dnf install buildah
```

**Usage:**
```bash
# Build with provided script
./container-alternatives/buildah-build.sh

# Run with Podman
podman run -d --name anglerphish -p 5000:5000 --env-file .env anglerphish:latest
```

**Benefits:**
- ✅ Scriptable builds
- ✅ No daemon required
- ✅ Fine-grained control
- ✅ Excellent for CI/CD
- ✅ Rootless builds

### 3. containerd + nerdctl

**Installation:**
```bash
# macOS (via Lima or similar)
brew install lima
limactl start template://docker

# Linux - install containerd and nerdctl
# Follow: https://github.com/containerd/nerdctl#installation
```

**Usage:**
```bash
# Using provided script
./container-alternatives/nerdctl-build.sh

# Using compose
nerdctl compose -f container-alternatives/nerdctl-compose.yml up -d

# Manual
nerdctl build -t anglerphish:latest .
nerdctl run -d --name anglerphish -p 5000:5000 --env-file .env anglerphish:latest
```

**Benefits:**
- ✅ Kubernetes-native
- ✅ High performance
- ✅ Docker CLI compatible
- ✅ Good for cloud-native environments

### 4. Lima (macOS/Linux VM)

**Installation:**
```bash
# macOS
brew install lima

# Linux
# Follow: https://github.com/lima-vm/lima#installation
```

**Usage:**
```bash
# Setup VM with all container tools
./container-alternatives/lima-setup.sh

# Access VM and use any container tool
limactl shell lima-anglerphish
cd anglerphish
docker-compose up -d  # or podman-compose, nerdctl compose, etc.
```

**Benefits:**
- ✅ Full Linux environment on macOS
- ✅ Supports multiple container tools
- ✅ Automatic port forwarding
- ✅ File system integration

### 5. Kubernetes Native

**Prerequisites:**
- Kubernetes cluster (local or cloud)
- kubectl configured

**Usage:**
```bash
# Deploy to Kubernetes
./container-alternatives/k8s-deploy.sh

# Manual deployment
kubectl apply -f container-alternatives/kubernetes-storage.yml
kubectl apply -f container-alternatives/kubernetes-build.yml

# Access application
kubectl port-forward service/anglerphish-service 5000:5000
```

**Benefits:**
- ✅ Production-ready orchestration
- ✅ Scaling and high availability
- ✅ Service discovery
- ✅ Built-in load balancing
- ✅ Rolling updates

## 🔧 Configuration Files Provided

```
container-alternatives/
├── podman-compose.yml          # Podman compose configuration
├── podman-build.sh            # Podman build script
├── buildah-build.sh           # Buildah image build script
├── nerdctl-compose.yml        # containerd/nerdctl compose
├── nerdctl-build.sh           # nerdctl build script
├── lima-anglerphish.yml       # Lima VM configuration
├── lima-setup.sh              # Lima setup script
├── kubernetes-build.yml       # Kubernetes deployment
├── kubernetes-storage.yml     # K8s storage and secrets
└── k8s-deploy.sh             # Kubernetes deploy script
```

## 🌟 Recommended Alternatives by Use Case

### For Development (macOS)
1. **Lima** - Full Linux environment with multiple container options
2. **Podman** - Direct Docker replacement, no daemon

### For CI/CD Pipelines
1. **Buildah** - Scriptable, rootless builds
2. **Podman** - Daemonless, better for automation

### For Production
1. **Kubernetes** - Full orchestration platform
2. **containerd + nerdctl** - Kubernetes-native runtime

### For Security-Conscious Environments
1. **Podman** - Rootless by default
2. **Buildah** - Fine-grained security controls

### For Enterprise/RHEL Environments
1. **Podman** - Red Hat's Docker alternative
2. **CRI-O + Kubernetes** - Enterprise Kubernetes stack

## ⚡ Performance Comparison

| Tool | Build Time | Runtime Overhead | Resource Usage | Startup Time |
|------|------------|------------------|----------------|--------------|
| Docker | Baseline | Low | Medium | Fast |
| Podman | +10-15% | Lower | Low | Fast |
| Buildah | Similar | N/A (build only) | Low | N/A |
| nerdctl | Similar | Lower | Low | Fast |
| Lima | +VM overhead | Medium | High | Slow (VM start) |
| K8s | Varies | Low | Medium | Medium |

## 🛠 Migration Guide

### From Docker to Podman
```bash
# Almost no changes needed
alias docker=podman
alias docker-compose=podman-compose

# Use existing docker-compose.yml
podman-compose up -d
```

### From Docker to nerdctl
```bash
# Very similar commands
nerdctl build -t app .
nerdctl run -d --name app -p 8080:8080 app
nerdctl compose up -d  # Limited compose support
```

### From Docker to Kubernetes
```bash
# Use provided Kubernetes manifests
kubectl apply -f container-alternatives/kubernetes-storage.yml
kubectl apply -f container-alternatives/kubernetes-build.yml
```

## 🚨 Important Considerations

### File Paths and Volumes
- **Podman**: Use same paths as Docker
- **Lima**: Automatic file sharing configured
- **Kubernetes**: Use PersistentVolumes (provided in configs)
- **nerdctl**: Same as Docker

### Networking
- **Podman**: Uses CNI networking (similar to Docker)
- **Lima**: Automatic port forwarding configured
- **Kubernetes**: Service discovery and ingress (configured)
- **nerdctl**: containerd networking

### Image Registries
All alternatives support standard registries:
```bash
# Examples
podman pull mongo:5-focal
nerdctl pull nginx:latest
buildah pull --tls-verify=false myregistry.com/app:latest
```

### Rootless Execution
| Tool | Rootless Support | Configuration |
|------|------------------|---------------|
| Podman | ✅ Default | No setup needed |
| Buildah | ✅ Default | No setup needed |
| nerdctl | ✅ Available | Requires setup |
| Docker | ⚠️ Rootless mode | Complex setup |

## 📚 Additional Resources

- **Podman**: https://podman.io/
- **Buildah**: https://buildah.io/
- **nerdctl**: https://github.com/containerd/nerdctl
- **Lima**: https://github.com/lima-vm/lima
- **Kubernetes**: https://kubernetes.io/

## 🔄 Switching Between Alternatives

The AnglerPhish project is designed to work with any OCI-compliant container system. Simply:

1. Choose your preferred alternative
2. Use the provided configuration files
3. Run the corresponding setup script
4. Access AnglerPhish on `http://localhost:5000`

All alternatives will produce the same functional AnglerPhish deployment with identical features and performance.