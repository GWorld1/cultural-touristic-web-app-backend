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

        stage('Containerize Auth Service') {
            steps {
                script {
                    echo 'Creating Docker image for Auth Service...'
                    // This builds the image and tags it with the current Jenkins BUILD_NUMBER
                    def authServiceImage = docker.build("gworld1/auth-service:${env.BUILD_NUMBER}", "microservices/auth-service")
                    echo "Auth Service Docker image built: ${authServiceImage.id}"
                }
            }
        }

        stage('Test Auth Service') {
            steps {
                // Securely providing environment variables for tests using Jenkins Credentials
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

        stage('Deploy Auth Service') {
            steps {
                script {
                    echo 'Deploying Auth Service to Kubernetes on Hostinger VPS...'

                    // Define the new image tag for this build
                    def serviceImage = "gworld1/auth-service:${env.BUILD_NUMBER}"
                    // Define the path to your combined Deployment and Service manifest
                    def manifestPath = "k8s-manifests/auth-service-deployment.yaml"

                    withCredentials([
                        file(credentialsId: 'k3s-kubeconfig', variable: 'KUBECONFIG_FILE_PATH'),
                        // Jenkins credentials for application secrets - these will be used to create K8s Secrets
                        string(credentialsId: 'JWT_SECRET_CREDENTIAL', variable: 'JWT_SECRET_VAL'),
                        string(credentialsId: 'APPWRITE_ENDPOINT_CREDENTIAL', variable: 'APPWRITE_ENDPOINT_VAL'),
                        string(credentialsId: 'APPWRITE_PROJECT_ID_CREDENTIAL', variable: 'APPWRITE_PROJECT_ID_VAL'),
                        string(credentialsId: 'APPWRITE_API_KEY_CREDENTIAL', variable: 'APPWRITE_API_KEY_VAL'),
                        string(credentialsId: 'APPWRITE_DATABASE_ID_CREDENTIAL', variable: 'APPWRITE_DATABASE_ID_VAL'),
                        string(credentialsId: 'APPWRITE_USERS_COLLECTION_ID_CREDENTIAL', variable: 'APPWRITE_USERS_COLLECTION_ID_VAL')
                    ]) {
                        // Set KUBECONFIG environment variable for kubectl commands to authenticate
                        withEnv(["KUBECONFIG=${KUBECONFIG_FILE_PATH}"]) {
                            echo "Kubectl is configured for deployment."

                            // Step 1: Create or Update Kubernetes Secret for Auth Service
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

                            // Step 2: Update the image tag in the Deployment manifest locally using yq
                            echo "Attempting to update image in ${manifestPath} to ${serviceImage}..."
                            sh 'yq --version' // Confirmed: yq version v4.44.2

                            // --- DEBUG START: Inspect manifest content BEFORE yq runs ---
                            echo "--- Manifest content BEFORE yq modification: ---"
                            sh "cat ${manifestPath}"
                            echo "--- End of BEFORE yq content ---"

                            // This yq command updates the image tag in your YAML file.
                            // The multi-line string (sh """...""") is used for better quoting reliability.
                            sh """
                                yq e '.spec.template.spec.containers[] | select(.name == "auth-service").image = "${serviceImage}"' -i "${manifestPath}"
                            """

                            // --- DEBUG END: Inspect manifest content AFTER yq runs, and before kubectl apply ---
                            echo "--- Manifest content AFTER yq modification: ---"
                            sh "cat ${manifestPath}"
                            echo "--- End of AFTER yq content ---"
                            sh "ls -l ${manifestPath}" // Check file permissions and size after yq
                            echo "Image update attempted via yq (check logs above for its effect)."


                            // Step 3: Apply the Kubernetes manifests to the cluster
                            echo "Applying Auth Service Kubernetes manifests from ${manifestPath}..."
                            sh "kubectl apply -f ${manifestPath}"
                            echo "Auth Service Kubernetes manifests applied."

                            // Step 4: Wait for the deployment rollout to complete
                            echo "Waiting for Auth Service deployment rollout to complete..."
                            sh "kubectl rollout status deployment/auth-service"
                            echo "Auth Service deployment updated successfully."
                        }
                    }
                    echo 'Auth Service deployment pipeline finished.'
                }
            }
        }

        // --- Comment Service Stages --- (Similar structure, yq enabled for debugging)
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

                    def serviceImage = "gworld1/comment-service:${env.BUILD_NUMBER}"
                    def manifestPath = "k8s-manifests/comment-service-deployment.yaml"

                    withCredentials([
                        file(credentialsId: 'k3s-kubeconfig', variable: 'KUBECONFIG_FILE_PATH'),
                        // Add credentials specific to Comment Service secrets here (replace placeholders)
                        string(credentialsId: 'APPWRITE_ENDPOINT_CREDENTIAL', variable: 'APPWRITE_ENDPOINT_VAL_COMMENT'),
                        string(credentialsId: 'APPWRITE_PROJECT_ID_CREDENTIAL', variable: 'APPWRITE_PROJECT_ID_VAL_COMMENT'),
                        string(credentialsId: 'APPWRITE_API_KEY_CREDENTIAL', variable: 'APPWRITE_API_KEY_VAL_COMMENT'),
                        string(credentialsId: 'APPWRITE_DATABASE_ID_CREDENTIAL', variable: 'APPWRITE_DATABASE_ID_VAL_COMMENT')
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

                            echo "Attempting to update image in ${manifestPath} to ${serviceImage}..."
                            sh 'yq --version'

                            echo "--- Manifest content BEFORE yq modification: ---"
                            sh "cat ${manifestPath}"
                            echo "--- End of BEFORE yq content ---"

                            sh """
                                yq e '.spec.template.spec.containers[] | select(.name == "comment-service").image = "${serviceImage}"' -i "${manifestPath}"
                            """

                            echo "--- Manifest content AFTER yq modification: ---"
                            sh "cat ${manifestPath}"
                            echo "--- End of AFTER yq content ---"
                            sh "ls -l ${manifestPath}"
                            echo "Image update attempted via yq."

                            echo "Applying Comment Service Kubernetes manifests from ${manifestPath}..."
                            sh "kubectl apply -f ${manifestPath}"
                            echo "Comment Service Kubernetes manifests applied."

                            echo "Waiting for Comment Service deployment to roll out..."
                            sh "kubectl rollout status deployment/comment-service"
                            echo "Comment Service deployment updated successfully."
                        }
                    }
                    echo 'Comment Service deployment pipeline finished.'
                }
            }
        }

        // --- Like Service Stages --- (Similar structure, yq enabled for debugging)
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

                    def serviceImage = "gworld1/like-service:${env.BUILD_NUMBER}"
                    def manifestPath = "k8s-manifests/like-service-deployment.yaml"

                    withCredentials([
                        file(credentialsId: 'k3s-kubeconfig', variable: 'KUBECONFIG_FILE_PATH'),
                        // Add credentials specific to Like Service secrets here (replace placeholders)
                        string(credentialsId: 'APPWRITE_ENDPOINT_CREDENTIAL', variable: 'APPWRITE_ENDPOINT_VAL_LIKE'),
                        string(credentialsId: 'APPWRITE_PROJECT_ID_CREDENTIAL', variable: 'APPWRITE_PROJECT_ID_VAL_LIKE'),
                        string(credentialsId: 'APPWRITE_API_KEY_CREDENTIAL', variable: 'APPWRITE_API_KEY_VAL_LIKE'),
                        string(credentialsId: 'APPWRITE_DATABASE_ID_CREDENTIAL', variable: 'APPWRITE_DATABASE_ID_VAL_LIKE')
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

                            echo "Attempting to update image in ${manifestPath} to ${serviceImage}..."
                            sh 'yq --version'

                            echo "--- Manifest content BEFORE yq modification: ---"
                            sh "cat ${manifestPath}"
                            echo "--- End of BEFORE yq content ---"

                            sh """
                                yq e '.spec.template.spec.containers[] | select(.name == "like-service").image = "${serviceImage}"' -i "${manifestPath}"
                            """

                            echo "--- Manifest content AFTER yq modification: ---"
                            sh "cat ${manifestPath}"
                            echo "--- End of AFTER yq content ---"
                            sh "ls -l ${manifestPath}"
                            echo "Image update attempted via yq."

                            echo "Applying Like Service Kubernetes manifests from ${manifestPath}..."
                            sh "kubectl apply -f ${manifestPath}"
                            echo "Like Service Kubernetes manifests applied."

                            echo "Waiting for Like Service deployment to roll out..."
                            sh "kubectl rollout status deployment/like-service"
                            echo "Like Service deployment updated successfully."
                        }
                    }
                    echo 'Like Service deployment pipeline finished.'
                }
            }
        }

        // --- Post Service Stages --- (Similar structure, yq enabled for debugging)
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

                    def serviceImage = "gworld1/post-service:${env.BUILD_NUMBER}"
                    def manifestPath = "k8s-manifests/post-service-deployment.yaml"

                    withCredentials([
                        file(credentialsId: 'k3s-kubeconfig', variable: 'KUBECONFIG_FILE_PATH'),
                        // Add credentials specific to Post Service secrets here (replace placeholders)
                        string(credentialsId: 'APPWRITE_ENDPOINT_CREDENTIAL', variable: 'APPWRITE_ENDPOINT_VAL_POST'),
                        string(credentialsId: 'APPWRITE_PROJECT_ID_CREDENTIAL', variable: 'APPWRITE_PROJECT_ID_VAL_POST'),
                        string(credentialsId: 'APPWRITE_API_KEY_CREDENTIAL', variable: 'APPWRITE_API_KEY_VAL_POST'),
                        string(credentialsId: 'APPWRITE_DATABASE_ID_CREDENTIAL', variable: 'APPWRITE_DATABASE_ID_VAL_POST')
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

                            echo "Attempting to update image in ${manifestPath} to ${serviceImage}..."
                            sh 'yq --version'

                            echo "--- Manifest content BEFORE yq modification: ---"
                            sh "cat ${manifestPath}"
                            echo "--- End of BEFORE yq content ---"

                            sh """
                                yq e '.spec.template.spec.containers[] | select(.name == "post-service").image = "${serviceImage}"' -i "${manifestPath}"
                            """

                            echo "--- Manifest content AFTER yq modification: ---"
                            sh "cat ${manifestPath}"
                            echo "--- End of AFTER yq content ---"
                            sh "ls -l ${manifestPath}"
                            echo "Image update attempted via yq."

                            echo "Applying Post Service Kubernetes manifests from ${manifestPath}..."
                            sh "kubectl apply -f ${manifestPath}"
                            echo "Post Service Kubernetes manifests applied."

                            echo "Waiting for Post Service deployment to roll out..."
                            sh "kubectl rollout status deployment/post-service"
                            echo "Post Service deployment updated successfully."
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
