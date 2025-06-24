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
                        sh 'npx test' // This runs the 'test' script defined in package.json
                    }
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
                        sh 'npm test'
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
                        sh 'npm test'
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
                        sh 'npm test'
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
