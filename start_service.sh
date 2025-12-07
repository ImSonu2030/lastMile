#!/bin/bash

minikube status > /dev/null 2>&1
minikube_status_code=$?
if [ $minikube_status_code -eq 0 ]; then
  echo "minikube is running."
else
  echo "minikube is not running, starting..."
  minikube start > /dev/null 2>&1
fi

kubectl create namespace lastmile --dry-run=client -o yaml | kubectl apply -f -

deploy_resource() {
  local resource_path="$1"
  echo "applying $resource_path"
  kubectl apply -f "$resource_path"
}

# Deploy services
basepath="./kubernetes"
fronpath="$basepath/frontend"
userpath="$basepath/user-service"
statpath="$basepath/station-service"
drivpath="$basepath/driver-service"
matcpath="$basepath/matching-service"
trippath="$basepath/trip-service"

deploy_resource "$basepath/lastmile-config.yml"
deploy_resource "$basepath/lastmile-secrets.yml"

deploy_resource "$fronpath/frontend-deployment.yml"
deploy_resource "$fronpath/frontend-svc.yml"
deploy_resource "$fronpath/frontend-ingress.yml"

deploy_resource "$userpath/user-service-deployment.yml"
deploy_resource "$userpath/user-service-svc.yml"
deploy_resource "$userpath/user-service-ingress.yml"

deploy_resource "$statpath/station-service-deployment.yml"
deploy_resource "$statpath/station-service-svc.yml"
deploy_resource "$statpath/station-service-ingress.yml"

deploy_resource "$drivpath/driver-service-deployment.yml"
deploy_resource "$drivpath/driver-service-svc.yml"
deploy_resource "$drivpath/driver-service-ingress.yml"

deploy_resource "$matcpath/matching-service-deployment.yml"
deploy_resource "$matcpath/matching-service-svc.yml"
deploy_resource "$matcpath/matching-service-ingress.yml"

deploy_resource "$trippath/trip-service-deployment.yml"
deploy_resource "$trippath/trip-service-svc.yml"
deploy_resource "$trippath/trip-service-ingress.yml"

DOMAIN="lastmile.local"
minikube_ip=$(minikube ip)
if grep -q "$DOMAIN" /etc/hosts; then
  echo "entry for $DOMAIN exists, overwriting with $minikube_ip"
  sudo sed -i "s/.*$DOMAIN$/$minikube_ip $DOMAIN/" /etc/hosts
else
  echo "adding $minikube_ip $DOMAIN to /etc/hosts"
  echo "$minikube_ip $DOMAIN" | sudo tee -a /etc/hosts
fi