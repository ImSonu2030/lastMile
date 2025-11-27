#!/bin/bash

minikube status > /dev/null 2>&1
minikube_status_code=$?
if [ $minikube_status_code -eq 0 ]; then
  echo "minikube is running."
else
  echo "minikube is not running, starting..."
  minikube start > /dev/null 2>&1
fi

minikube addons enable ingress > /dev/null 2>&1
kubectl create namespace lastmile

deploy_resource() {
  local resource_path="$1"
  echo "applying $resource_path"
  kubectl apply -f "$resource_path"
}

# Deploy services
basepath="./kubernetes"
fronpath="$basepath/frontend"
# userpath="$basepath/user-service"

deploy_resource "$basepath/lastmile-config.yml"
deploy_resource "$basepath/lastmile-secrets.yml"

deploy_resource "$fronpath/frontend-deployment.yml"
deploy_resource "$fronpath/frontend-svc.yml"
deploy_resource "$fronpath/frontend-ingress.yml"

DOMAIN="lastmile.local"
minikube_ip=$(minikube ip)
if grep -q "$DOMAIN" /etc/hosts; then
  echo "entry for $DOMAIN exists, overwriting with $minikube_ip"
  sudo sed -i "s/.*$DOMAIN$/$minikube_ip $DOMAIN/" /etc/hosts
else
  echo "adding $minikube_ip $DOMAIN to /etc/hosts"
  echo "$minikube_ip $DOMAIN" | sudo tee -a /etc/hosts
fi