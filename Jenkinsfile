pipeline {
    agent any

    environment {
        DOCKERHUB_CRED = 'dockerhub_cred'
        DOCKERHUB_REPO = 'imsonu2030'

        FRON_IMAGE = 'lastmile-frontend'
        USER_IMAGE = 'lastmile-user-service'

        BASE_URL="http://lastmile.local/api"
        VITE_USER_SERVICE = "${BASE_URL}/user"
        VITE_DRIVER_SERVICE = "${BASE_URL}/driver"
        VITE_STATION_SERVICE = "${BASE_URL}/station"
        VITE_MATCHING_SERVICE = "${BASE_URL}/matching"

        VITE_SUPABASE_URL = credentials('lastmile-supabase-url') 
        VITE_SUPABASE_KEY = credentials('lastmile-supabase-key')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Push Frontend') {
            steps {
                script {
                    def frontendArgs = "--build-arg VITE_SUPABASE_URL=${VITE_SUPABASE_URL} " +
                                       "--build-arg VITE_SUPABASE_KEY=${VITE_SUPABASE_KEY} " +
                                       "--build-arg VITE_USER_SERVICE=${VITE_USER_SERVICE} " +
                                       "--build-arg VITE_STATION_SERVICE=${VITE_STATION_SERVICE} " +
                                       "--build-arg VITE_DRIVER_SERVICE=${VITE_DRIVER_SERVICE} " +
                                       "--build-arg VITE_MATCHING_SERVICE=${VITE_MATCHING_SERVICE}"

                    docker.withRegistry('', "${DOCKERHUB_CRED}") {
                        buildAndPushImage("${DOCKERHUB_REPO}/${FRON_IMAGE}:latest", './frontend', frontendArgs)
                    }
                }
            }
        }

        stage('Build & Push User Service') {
            steps {
                script {
                    docker.withRegistry('', "${DOCKERHUB_CRED}") {
                        buildAndPushImage("${DOCKERHUB_REPO}/${USER_IMAGE}:latest", './user-service', "")
                    }
                }
            }
        }
        
    }
}

def buildAndPushImage(String fullImageName, String contextPath, String extraBuildArgs) {
    echo "Building image: ${fullImageName}"
    
    def defaultArgs = "--build-arg BUILDKIT_INLINE_CACHE=1"
    
    def buildCommand = "${defaultArgs} ${extraBuildArgs} -f ${contextPath}/Dockerfile ${contextPath}"
    
    def builtImage = docker.build(fullImageName, buildCommand)
    builtImage.push()
    echo "Successfully pushed: ${fullImageName}"
}