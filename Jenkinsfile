pipeline {
    agent any

    tools {
        git 'Default'
        nodejs 'JenkinsNodeJS' // Ensure this matches your NodeJS tool configuration name
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo 'Checking out code from SCM.'
                checkout scm
            }
        }

        // --- Auth Service Stages ---
        stage('Build Auth Service') {
            steps {
                dir('microservices/auth-service') {
                    echo 'Building Auth Service...'
                    sh 'npm install'
                }
            }
        }

        stage('Containerize Auth Service') {
            steps {
                script {
                    echo 'Containerizing Auth Service...'
                    // This assumes Docker is installed and configured on your Jenkins agent.
                    def authServiceImage = docker.build("gworld1/auth-service:${env.BUILD_NUMBER}", "microservices/auth-service")
                    echo "Docker image built for Auth Service: ${authServiceImage.id}"
                }
            }
        }

        stage('Test Auth Service') {
            steps {
                // Using Jenkins Credentials to provide environment variables securely
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
                        sh 'npx jest' // This runs the 'test' script defined in package.json
                    }
                }
            }
        }

        // Deploy Auth Service to Kubernetes using kubectl apply -f
        stage('Deploy Auth Service') {
            steps {
                script {
                    echo 'Deploying Auth Service to Kubernetes on Hostinger VPS using manifests...'

                    def serviceImage = "gworld1/auth-service:${env.BUILD_NUMBER}"
                    // The path to your Auth Service Deployment manifest within your Git repository
                    def deploymentManifestPath = "k8s-manifests/auth-service-deployment.yaml"
                    // The path to your Auth Service Service manifest (if separate)
                    def serviceManifestPath = "k8s-manifests/auth-service-service.yaml" // Assuming you might have one

                    withCredentials([
                        // Use the 'Secret file' credential with the kubeconfig content
                        file(credentialsId: 'k3s-kubeconfig', variable: 'KUBECONFIG_FILE_PATH'),
                        // Jenkins credentials for application secrets - these will be used to create K8s Secrets
                        string(credentialsId: 'JWT_SECRET_CREDENTIAL', variable: 'JWT_SECRET_VAL'),
                        string(credentialsId: 'APPWRITE_ENDPOINT_CREDENTIAL', variable: 'APPWRITE_ENDPOINT_VAL'),
                        string(credentialsId: 'APPWRITE_PROJECT_ID_CREDENTIAL', variable: 'APPWRITE_PROJECT_ID_VAL'),
                        string(credentialsId: 'APPWRITE_API_KEY_CREDENTIAL', variable: 'APPWRITE_API_KEY_VAL'),
                        string(credentialsId: 'APPWRITE_DATABASE_ID_CREDENTIAL', variable: 'APPWRITE_DATABASE_ID_VAL'),
                        string(credentialsId: 'APPWRITE_USERS_COLLECTION_ID_CREDENTIAL', variable: 'APPWRITE_USERS_COLLECTION_ID_VAL')
                    ]) {
                        // Set KUBECONFIG environment variable for kubectl commands
                        withEnv(["KUBECONFIG=${KUBECONFIG_FILE_PATH}"]) {
                            echo "Kubectl is configured."

                            // Step 1: Create or Update Kubernetes Secret for Auth Service
                            // This command creates or updates a Kubernetes Secret named 'auth-service-secrets'
                            // from the values provided by Jenkins credentials.
                            echo "Creating/Updating Kubernetes Secret 'auth-service-secrets'..."
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
                            echo "Kubernetes Secret 'auth-service-secrets' created/updated."

                            // Step 2: Update the image tag in the Deployment manifest locally
                            // We use 'yq' to modify the YAML file in the Jenkins workspace
                            // before applying it to the cluster.
                            // Ensure the 'name' of your container in the 'auth-service-deployment.yaml'
                            // matches 'auth-service-container' or adjust the yq path accordingly.
                            echo "Updating image in ${deploymentManifestPath} to ${serviceImage}..."
                            sh "yq e '.spec.template.spec.containers[] | select(.name == \"auth-service\").image = \"${serviceImage}\"' -i ${deploymentManifestPath}"
                            // If your container has a different name, replace "auth-service-container"
                            // If it's the first and only container, you can use:
                            // sh "yq e '.spec.template.spec.containers[0].image = \"${serviceImage}\"' -i ${deploymentManifestPath}"
                            echo "Image updated in local manifest."

                            // Step 3: Apply the Kubernetes manifests to the cluster
                            // This will create or update the Deployment and Service.
                            // If only the image in the Deployment changed, it will trigger a rolling update.
                            echo "Applying Auth Service Kubernetes manifests from ${deploymentManifestPath} and ${serviceManifestPath}..."
                            sh "kubectl apply -f ${deploymentManifestPath}"
                            // If you have a separate service YAML, apply it too. Remove this line if not needed.
                            sh "kubectl apply -f ${serviceManifestPath}"
                            echo "Auth Service Kubernetes manifests applied."

                            // Step 4: Wait for the deployment rollout to complete
                            // This ensures the new pods are running and healthy before marking the stage successful.
                            // 'auth-service' is the assumed name of your Kubernetes Deployment. Verify this.
                            echo "Waiting for Auth Service deployment rollout to complete..."
                            sh "kubectl rollout status deployment/auth-service"
                            echo "Auth Service deployment rollout complete."
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
                    echo 'Building Comment Service...'
                    sh 'npm install'
                }
            }
        }

        stage('Test Comment Service') {
            steps {
                // Assuming Comment Service might also need Appwrite env vars,
                // or similar ones. Adjust credentials if it needs different ones.
                withCredentials([
                    string(credentialsId: 'APPWRITE_ENDPOINT_CREDENTIAL', variable: 'APPWRITE_ENDPOINT'),
                    string(credentialsId: 'APPWRITE_PROJECT_ID_CREDENTIAL', variable: 'APPWRITE_PROJECT_ID'),
                    string(credentialsId: 'APPWRITE_API_KEY_CREDENTIAL', variable: 'APPWRITE_API_KEY'),
                    string(credentialsId: 'APPWRITE_DATABASE_ID_CREDENTIAL', variable: 'APPWRITE_DATABASE_ID')
                    // Add other Comment Service specific env vars if needed
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
                    echo 'Containerizing Comment Service...'
                    def commentServiceImage = docker.build("gworld1/comment-service:${env.BUILD_NUMBER}", "microservices/comment-service")
                    echo "Docker image built for Comment Service: ${commentServiceImage.id}"
                }
            }
        }

        // --- Like Service Stages ---
        stage('Build Like Service') {
            steps {
                dir('microservices/like-service') {
                    echo 'Building Like Service...'
                    sh 'npm install'
                }
            }
        }

        stage('Test Like Service') {
            steps {
                // Assuming Like Service might also need Appwrite env vars.
                withCredentials([
                    string(credentialsId: 'APPWRITE_ENDPOINT_CREDENTIAL', variable: 'APPWRITE_ENDPOINT'),
                    string(credentialsId: 'APPWRITE_PROJECT_ID_CREDENTIAL', variable: 'APPWRITE_PROJECT_ID'),
                    string(credentialsId: 'APPWRITE_API_KEY_CREDENTIAL', variable: 'APPWRITE_API_KEY'),
                    string(credentialsId: 'APPWRITE_DATABASE_ID_CREDENTIAL', variable: 'APPWRITE_DATABASE_ID')
                    // Add other Like Service specific env vars if needed
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
                    echo 'Containerizing Like Service...'
                    def likeServiceImage = docker.build("gworld1/like-service:${env.BUILD_NUMBER}", "microservices/like-service")
                    echo "Docker image built for Like Service: ${likeServiceImage.id}"
                }
            }
        }

        // --- Post Service Stages ---
        stage('Build Post Service') {
            steps {
                dir('microservices/post-service') {
                    echo 'Building Post Service...'
                    sh 'npm install'
                }
            }
        }

        stage('Test Post Service') {
            steps {
                // Assuming Post Service might also need Appwrite env vars.
                withCredentials([
                    string(credentialsId: 'APPWRITE_ENDPOINT_CREDENTIAL', variable: 'APPWRITE_ENDPOINT'),
                    string(credentialsId: 'APPWRITE_PROJECT_ID_CREDENTIAL', variable: 'APPWRITE_PROJECT_ID'),
                    string(credentialsId: 'APPWRITE_API_KEY_CREDENTIAL', variable: 'APPWRITE_API_KEY'),
                    string(credentialsId: 'APPWRITE_DATABASE_ID_CREDENTIAL', variable: 'APPWRITE_DATABASE_ID')
                    // Add other Post Service specific env vars if needed
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
                    echo 'Containerizing Post Service...'
                    def postServiceImage = docker.build("gworld1/post-service:${env.BUILD_NUMBER}", "microservices/post-service")
                    echo "Docker image built for Post Service: ${postServiceImage.id}"
                }
            }
        }
    } // Closes the stages block

    post {
        always {
            echo 'Pipeline finished.'
        }
        failure {
            echo 'Pipeline failed. Check logs for details.'
        }
        success {
            echo 'Pipeline succeeded!'
        }
    }
}
