pipeline {
    agent any

    tools {
        git 'Default'
        nodejs 'JenkinsNodeJS' // Make sure this matches your NodeJS tool configuration name in Jenkins
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo 'Pulling the latest code from our repository.'
                checkout scm
            }
        }

        // --- Auth Service Stages ---
        stage('Build Auth Service') {
            steps {
                dir('microservices/auth-service') {
                    echo 'Building Auth Service dependencies...'
                    sh 'npm install'
                }
            }
        }

        
        stage('Test Auth Service') {
            steps {
                // Securely providing environment variables for tests
                withCredentials([
                    string(credentialsId: 'JWT_SECRET_CREDENTIAL', variable: 'JWT_SECRET'),
                    string(credentialsId: 'APPWRITE_ENDPOINT_CREDENTIAL', variable: 'APPWRITE_ENDPOINT'),
                    string(credentialsId: 'APPWRITE_PROJECT_ID_CREDENTIAL', variable: 'APPWRITE_PROJECT_ID'),
                    string(credentialsId: 'APPWRITE_API_KEY_CREDENTIAL', variable: 'APPWRITE_API_KEY'),
                    string(credentialsId: 'APPWRITE_DATABASE_ID_CREDENTIAL', variable: 'APPWRITE_DATABASE_ID'),
                    string(credentialsId: 'APPWRITE_USERS_COLLECTION_ID_CREDENTIAL', variable: 'APPWRITE_USERS_COLLECTION_ID')
                ]) {
                    dir('microservices/auth-service') {
                        echo 'Running tests for Auth Service...'
                        sh 'npx jest'
                    }
                }
            }
        }

        
        stage('Containerize Auth Service') {
            steps {
                script {
                    echo 'Creating Docker image for Auth Service...'
                    def authServiceImage = docker.build("gworld1/auth-service:${env.BUILD_NUMBER}", "microservices/auth-service")
                    echo "Auth Service Docker image built: ${authServiceImage.id}"
                }
            }
        }


        stage('Deploy Auth Service') {
            steps {
                script {
                    echo 'Deploying Auth Service to Kubernetes on Hostinger VPS...'

                    // Define the path to your combined Deployment and Service manifest
                    def manifestPath = "k8s-manifests/auth-service-deployment.yaml"

                    withCredentials([
                        file(credentialsId: 'k3s-kubeconfig', variable: 'KUBECONFIG_FILE_PATH'),
                        string(credentialsId: 'JWT_SECRET_CREDENTIAL', variable: 'JWT_SECRET_VAL'),
                        string(credentialsId: 'APPWRITE_ENDPOINT_CREDENTIAL', variable: 'APPWRITE_ENDPOINT_VAL'),
                        string(credentialsId: 'APPWRITE_PROJECT_ID_CREDENTIAL', variable: 'APPWRITE_PROJECT_ID_VAL'),
                        string(credentialsId: 'APPWRITE_API_KEY_CREDENTIAL', variable: 'APPWRITE_API_KEY_VAL'),
                        string(credentialsId: 'APPWRITE_DATABASE_ID_CREDENTIAL', variable: 'APPWRITE_DATABASE_ID_VAL'),
                        string(credentialsId: 'APPWRITE_USERS_COLLECTION_ID_CREDENTIAL', variable: 'APPWRITE_USERS_COLLECTION_ID_VAL')
                    ]) {
                        withEnv(["KUBECONFIG=${KUBECONFIG_FILE_PATH}"]) {
                            echo "Kubectl is configured."

                            echo "Creating or updating 'auth-service-secrets' in Kubernetes..."
                            sh """
                                kubectl create secret generic auth-service-secrets \\
                                --from-literal=JWT_SECRET=${JWT_SECRET_VAL} \\
                                --from-literal=APPWRITE_ENDPOINT=${APPWRITE_ENDPOINT_VAL} \\
                                --from-literal=APPWRITE_PROJECT_ID=${APPWRITE_PROJECT_ID_VAL} \\
                                --from-literal=APPWRITE_API_KEY=${APPWRITE_API_KEY_VAL} \\
                                --from-literal=APPWRITE_DATABASE_ID=${APPWRITE_DATABASE_ID_VAL} \\
                                --from-literal=APPWRITE_USERS_COLLECTION_ID=${APPWRITE_USERS_COLLECTION_ID_VAL} \\
                                --dry-run=client -o yaml | kubectl apply -f -
                            """
                            echo "Kubernetes secret for Auth Service handled."

                            echo "Applying Auth Service Kubernetes manifests from ${manifestPath}..."
                            sh "kubectl apply -f ${manifestPath}"
                            echo "Auth Service Kubernetes manifests applied."

                            echo "Waiting for Auth Service deployment to roll out..."
                            sh "kubectl rollout status deployment/auth-service"
                            echo "Auth Service deployment updated."
                        }
                    }
                    echo 'Auth Service deployment pipeline finished.'
                }
            }
        }

        // --- Comment Service Stages ---
        stage('Build Comment Service') {
            steps {
                dir('microservices/comment-service') {
                    echo 'Building Comment Service dependencies...'
                    sh 'npm install'
                }
            }
        }

        stage('Test Comment Service') {
            steps {
                // Adjust these credentials based on your Comment Service's needs
                withCredentials([
                    string(credentialsId: 'APPWRITE_ENDPOINT_CREDENTIAL', variable: 'APPWRITE_ENDPOINT'),
                    string(credentialsId: 'APPWRITE_PROJECT_ID_CREDENTIAL', variable: 'APPWRITE_PROJECT_ID'),
                    string(credentialsId: 'APPWRITE_API_KEY_CREDENTIAL', variable: 'APPWRITE_API_KEY'),
                    string(credentialsId: 'APPWRITE_DATABASE_ID_CREDENTIAL', variable: 'APPWRITE_DATABASE_ID')
                ]) {
                    dir('microservices/comment-service') {
                        echo 'Running tests for Comment Service...'
                        sh 'npx jest'
                    }
                }
            }
        }

        stage('Containerize Comment Service') {
            steps {
                script {
                    echo 'Creating Docker image for Comment Service...'
                    def commentServiceImage = docker.build("gworld1/comment-service:${env.BUILD_NUMBER}", "microservices/comment-service")
                    echo "Comment Service Docker image built: ${commentServiceImage.id}"
                }
            }
        }

        stage('Deploy Comment Service') {
            steps {
                script {
                    echo 'Deploying Comment Service to Kubernetes...'

                    def manifestPath = "k8s-manifests/comment-service-deployment.yaml"

                    withCredentials([
                        file(credentialsId: 'k3s-kubeconfig', variable: 'KUBECONFIG_FILE_PATH'),
                        // Add credentials specific to Comment Service secrets here
                        string(credentialsId: 'APPWRITE_ENDPOINT_CREDENTIAL', variable: 'APPWRITE_ENDPOINT_VAL_COMMENT'), // Placeholder
                        string(credentialsId: 'APPWRITE_PROJECT_ID_CREDENTIAL', variable: 'APPWRITE_PROJECT_ID_VAL_COMMENT'), // Placeholder
                        string(credentialsId: 'APPWRITE_API_KEY_CREDENTIAL', variable: 'APPWRITE_API_KEY_VAL_COMMENT'), // Placeholder
                        string(credentialsId: 'APPWRITE_DATABASE_ID_CREDENTIAL', variable: 'APPWRITE_DATABASE_ID_VAL_COMMENT') // Placeholder
                    ]) {
                        withEnv(["KUBECONFIG=${KUBECONFIG_FILE_PATH}"]) {
                            echo "Kubectl is configured."

                            echo "Creating or updating 'comment-service-secrets' in Kubernetes..."
                            sh """
                                kubectl create secret generic comment-service-secrets \\
                                --from-literal=APPWRITE_ENDPOINT=${APPWRITE_ENDPOINT_VAL_COMMENT} \\
                                --from-literal=APPWRITE_PROJECT_ID=${APPWRITE_PROJECT_ID_VAL_COMMENT} \\
                                --from-literal=APPWRITE_API_KEY=${APPWRITE_API_KEY_VAL_COMMENT} \\
                                --from-literal=APPWRITE_DATABASE_ID=${APPWRITE_DATABASE_ID_VAL_COMMENT} \\
                                --dry-run=client -o yaml | kubectl apply -f -
                            """
                            echo "Kubernetes secret for Comment Service handled."

                            echo "Applying Comment Service Kubernetes manifests from ${manifestPath}..."
                            sh "kubectl apply -f ${manifestPath}"
                            echo "Comment Service Kubernetes manifests applied."

                            echo "Waiting for Comment Service deployment to roll out..."
                            sh "kubectl rollout status deployment/comment-service"
                            echo "Comment Service deployment updated."
                        }
                    }
                    echo 'Comment Service deployment pipeline finished.'
                }
            }
        }

        // --- Like Service Stages ---
        stage('Build Like Service') {
            steps {
                dir('microservices/like-service') {
                    echo 'Building Like Service dependencies...'
                    sh 'npm install'
                }
            }
        }

        stage('Test Like Service') {
            steps {
                // Adjust these credentials based on your Like Service's needs
                withCredentials([
                    string(credentialsId: 'APPWRITE_ENDPOINT_CREDENTIAL', variable: 'APPWRITE_ENDPOINT'),
                    string(credentialsId: 'APPWRITE_PROJECT_ID_CREDENTIAL', variable: 'APPWRITE_PROJECT_ID'),
                    string(credentialsId: 'APPWRITE_API_KEY_CREDENTIAL', variable: 'APPWRITE_API_KEY'),
                    string(credentialsId: 'APPWRITE_DATABASE_ID_CREDENTIAL', variable: 'APPWRITE_DATABASE_ID')
                ]) {
                    dir('microservices/like-service') {
                        echo 'Running tests for Like Service...'
                        sh 'npx jest'
                    }
                }
            }
        }

        stage('Containerize Like Service') {
            steps {
                script {
                    echo 'Creating Docker image for Like Service...'
                    def likeServiceImage = docker.build("gworld1/like-service:${env.BUILD_NUMBER}", "microservices/like-service")
                    echo "Like Service Docker image built: ${likeServiceImage.id}"
                }
            }
        }

        stage('Deploy Like Service') {
            steps {
                script {
                    echo 'Deploying Like Service to Kubernetes...'

                    def manifestPath = "k8s-manifests/like-service-deployment.yaml"

                    withCredentials([
                        file(credentialsId: 'k3s-kubeconfig', variable: 'KUBECONFIG_FILE_PATH'),
                        // Add credentials specific to Like Service secrets here
                        string(credentialsId: 'APPWRITE_ENDPOINT_CREDENTIAL', variable: 'APPWRITE_ENDPOINT_VAL_LIKE'), // Placeholder
                        string(credentialsId: 'APPWRITE_PROJECT_ID_CREDENTIAL', variable: 'APPWRITE_PROJECT_ID_VAL_LIKE'), // Placeholder
                        string(credentialsId: 'APPWRITE_API_KEY_CREDENTIAL', variable: 'APPWRITE_API_KEY_VAL_LIKE'), // Placeholder
                        string(credentialsId: 'APPWRITE_DATABASE_ID_CREDENTIAL', variable: 'APPWRITE_DATABASE_ID_VAL_LIKE') // Placeholder
                    ]) {
                        withEnv(["KUBECONFIG=${KUBECONFIG_FILE_PATH}"]) {
                            echo "Kubectl is configured."

                            echo "Creating or updating 'like-service-secrets' in Kubernetes..."
                            sh """
                                kubectl create secret generic like-service-secrets \\
                                --from-literal=APPWRITE_ENDPOINT=${APPWRITE_ENDPOINT_VAL_LIKE} \\
                                --from-literal=APPWRITE_PROJECT_ID=${APPWRITE_PROJECT_ID_VAL_LIKE} \\
                                --from-literal=APPWRITE_API_KEY=${APPWRITE_API_KEY_VAL_LIKE} \\
                                --from-literal=APPWRITE_DATABASE_ID=${APPWRITE_DATABASE_ID_VAL_LIKE} \\
                                --dry-run=client -o yaml | kubectl apply -f -
                            """
                            echo "Kubernetes secret for Like Service handled."

                            echo "Applying Like Service Kubernetes manifests from ${manifestPath}..."
                            sh "kubectl apply -f ${manifestPath}"
                            echo "Like Service Kubernetes manifests applied."

                            echo "Waiting for Like Service deployment to roll out..."
                            sh "kubectl rollout status deployment/like-service"
                            echo "Like Service deployment updated."
                        }
                    }
                    echo 'Like Service deployment pipeline finished.'
                }
            }
        }

        // --- Post Service Stages ---
        stage('Build Post Service') {
            steps {
                dir('microservices/post-service') {
                    echo 'Building Post Service dependencies...'
                    sh 'npm install'
                }
            }
        }

        stage('Test Post Service') {
            steps {
                // Adjust these credentials based on your Post Service's needs
                withCredentials([
                    string(credentialsId: 'APPWRITE_ENDPOINT_CREDENTIAL', variable: 'APPWRITE_ENDPOINT'),
                    string(credentialsId: 'APPWRITE_PROJECT_ID_CREDENTIAL', variable: 'APPWRITE_PROJECT_ID'),
                    string(credentialsId: 'APPWRITE_API_KEY_CREDENTIAL', variable: 'APPWRITE_API_KEY'),
                    string(credentialsId: 'APPWRITE_DATABASE_ID_CREDENTIAL', variable: 'APPWRITE_DATABASE_ID')
                ]) {
                    dir('microservices/post-service') {
                        echo 'Running tests for Post Service...'
                        sh 'npx jest'
                    }
                }
            }
        }

        stage('Containerize Post Service') {
            steps {
                script {
                    echo 'Creating Docker image for Post Service...'
                    def postServiceImage = docker.build("gworld1/post-service:${env.BUILD_NUMBER}", "microservices/post-service")
                    echo "Post Service Docker image built: ${postServiceImage.id}"
                }
            }
        }

        stage('Deploy Post Service') {
            steps {
                script {
                    echo 'Deploying Post Service to Kubernetes...'

                    def manifestPath = "k8s-manifests/post-service-deployment.yaml"

                    withCredentials([
                        file(credentialsId: 'k3s-kubeconfig', variable: 'KUBECONFIG_FILE_PATH'),
                        // Add credentials specific to Post Service secrets here
                        string(credentialsId: 'APPWRITE_ENDPOINT_CREDENTIAL', variable: 'APPWRITE_ENDPOINT_VAL_POST'), // Placeholder
                        string(credentialsId: 'APPWRITE_PROJECT_ID_CREDENTIAL', variable: 'APPWRITE_PROJECT_ID_VAL_POST'), // Placeholder
                        string(credentialsId: 'APPWRITE_API_KEY_CREDENTIAL', variable: 'APPWRITE_API_KEY_VAL_POST'), // Placeholder
                        string(credentialsId: 'APPWRITE_DATABASE_ID_CREDENTIAL', variable: 'APPWRITE_DATABASE_ID_VAL_POST') // Placeholder
                    ]) {
                        withEnv(["KUBECONFIG=${KUBECONFIG_FILE_PATH}"]) {
                            echo "Kubectl is configured."

                            echo "Creating or updating 'post-service-secrets' in Kubernetes..."
                            sh """
                                kubectl create secret generic post-service-secrets \\
                                --from-literal=APPWRITE_ENDPOINT=${APPWRITE_ENDPOINT_VAL_POST} \\
                                --from-literal=APPWRITE_PROJECT_ID=${APPWRITE_PROJECT_ID_VAL_POST} \\
                                --from-literal=APPWRITE_API_KEY=${APPWRITE_API_KEY_VAL_POST} \\
                                --from-literal=APPWRITE_DATABASE_ID=${APPWRITE_DATABASE_ID_VAL_POST} \\
                                --dry-run=client -o yaml | kubectl apply -f -
                            """
                            echo "Kubernetes secret for Post Service handled."

                            echo "Applying Post Service Kubernetes manifests from ${manifestPath}..."
                            sh "kubectl apply -f ${manifestPath}"
                            echo "Post Service Kubernetes manifests applied."

                            echo "Waiting for Post Service deployment to roll out..."
                            sh "kubectl rollout status deployment/post-service"
                            echo "Post Service deployment updated."
                        }
                    }
                    echo 'Post Service deployment pipeline finished.'
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline run complete. Check the console output for details.'
        }
        failure {
            echo 'Pipeline failed. Time to investigate!'
        }
        success {
            echo 'Pipeline succeeded! All services processed.'
        }
    }
}
