#!/bin/bash
# Kubernetes deployment script for AnglerPhish

set -e

echo "☸️  Deploying AnglerPhish to Kubernetes"
echo "======================================"

# Navigate to project root
cd "$(dirname "$0")/.."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if we're connected to a cluster
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Not connected to a Kubernetes cluster. Please configure kubectl."
    exit 1
fi

echo "📋 Current cluster info:"
kubectl cluster-info

# Apply storage configuration
echo "💾 Creating persistent volumes and secrets..."
kubectl apply -f container-alternatives/kubernetes-storage.yml

# Wait for PVCs to be bound
echo "⏳ Waiting for persistent volumes to be ready..."
kubectl wait --for=condition=Bound pvc/anglerphish-uploads-pvc --timeout=60s
kubectl wait --for=condition=Bound pvc/anglerphish-logs-pvc --timeout=60s
kubectl wait --for=condition=Bound pvc/mongodb-data-pvc --timeout=60s

# Deploy applications
echo "🚀 Deploying AnglerPhish application and MongoDB..."
kubectl apply -f container-alternatives/kubernetes-build.yml

# Wait for deployments to be ready
echo "⏳ Waiting for deployments to be ready..."
kubectl wait --for=condition=Available deployment/mongodb --timeout=120s
kubectl wait --for=condition=Available deployment/anglerphish-app --timeout=180s

# Show deployment status
echo "✅ Deployment complete!"
echo ""
echo "📋 Deployment status:"
kubectl get deployments
echo ""
echo "🌐 Services:"
kubectl get services
echo ""
echo "💾 Persistent volumes:"
kubectl get pvc

# Get service URL
echo ""
echo "🎣 Accessing AnglerPhish:"
if kubectl get service anglerphish-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}' &> /dev/null; then
    EXTERNAL_IP=$(kubectl get service anglerphish-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    echo "  External IP: http://$EXTERNAL_IP:5000"
elif kubectl get service anglerphish-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' &> /dev/null; then
    EXTERNAL_HOST=$(kubectl get service anglerphish-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    echo "  External Host: http://$EXTERNAL_HOST:5000"
else
    echo "  Port Forward: kubectl port-forward service/anglerphish-service 5000:5000"
    echo "  Then access: http://localhost:5000"
fi

echo ""
echo "📊 Useful commands:"
echo "  kubectl logs -l app=anglerphish           # Application logs"
echo "  kubectl logs -l app=mongodb               # MongoDB logs"
echo "  kubectl port-forward svc/anglerphish-service 5000:5000  # Local access"
echo "  kubectl delete -f container-alternatives/kubernetes-build.yml  # Clean up"