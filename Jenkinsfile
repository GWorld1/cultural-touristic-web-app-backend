pipeline {
    agent any

    tools {
        git 'Default'
        nodejs 'JenkinsNodeJS' // Ensure this matches your NodeJS tool configuration name
    }

    stages { // This starts the 'stages' block
        stage('Checkout Code') {
            steps {
                echo 'Checking out code from SCM.'
                // This step is crucial to actually clone the repository.
                // It uses the Git Repository URL and Credentials configured in the Jenkins job.
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

        stage('Test Auth Service') { // New Test Stage for Auth Service
            steps {
                dir('microservices/auth-service') {
                    echo 'Running tests for Auth Service...'
                    sh 'npm test' // This runs the 'test' script defined in package.json
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
                    // Optional: If you want to push to Docker Hub, you'll need docker.withRegistry() and credentials.
                    // docker.withRegistry('https://registry.hub.docker.com', 'dockerhub-credentials-id') { // Replace 'dockerhub-credentials-id'
                    //     authServiceImage.push()
                    // }
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

        stage('Test Comment Service') { // New Test Stage for Comment Service
            steps {
                dir('microservices/comment-service') {
                    echo 'Running tests for Comment Service...'
                    sh 'npm test'
                }
            }
        }

        stage('Containerize Comment Service') {
            steps {
                script {
                    echo 'Containerizing Comment Service...'
                    def commentServiceImage = docker.build("gworld1/comment-service:${env.BUILD_NUMBER}", "microservices/comment-service")
                    echo "Docker image built for Comment Service: ${commentServiceImage.id}"
                    // docker.withRegistry('https://registry.hub.docker.com', 'dockerhub-credentials-id') {
                    //     commentServiceImage.push()
                    // }
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

        stage('Test Like Service') { // New Test Stage for Like Service
            steps {
                dir('microservices/like-service') {
                    echo 'Running tests for Like Service...'
                    sh 'npm test'
                }
            }
        }

        stage('Containerize Like Service') {
            steps {
                script {
                    echo 'Containerizing Like Service...'
                    def likeServiceImage = docker.build("gworld1/like-service:${env.BUILD_NUMBER}", "microservices/like-service")
                    echo "Docker image built for Like Service: ${likeServiceImage.id}"
                    // docker.withRegistry('https://registry.hub.docker.com', 'dockerhub-credentials-id') {
                    //     likeServiceImage.push()
                    // }
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

        stage('Test Post Service') { // New Test Stage for Post Service
            steps {
                dir('microservices/post-service') {
                    echo 'Running tests for Post Service...'
                    sh 'npm test'
                }
            }
        }

        stage('Containerize Post Service') {
            steps {
                script {
                    echo 'Containerizing Post Service...'
                    def postServiceImage = docker.build("gworld1/post-service:${env.BUILD_NUMBER}", "microservices/post-service")
                    echo "Docker image built for Post Service: ${postServiceImage.id}"
                    // docker.withRegistry('https://registry.hub.docker.com', 'dockerhub-credentials-id') {
                    //     postServiceImage.push()
                    // }
                }
            }
        }
    } // This is the missing '}' that closes the 'stages' block

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
