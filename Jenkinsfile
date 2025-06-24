// Jenkins file

pipeline {
    agent any // This tells Jenkins to run the pipeline on any available agent

    tools {
       // configured on Jenkins
        git 'Default' //
        nodejs 'JenkinsNodeJS' //
    }

    stages {
        stage('Checkout Code') {
            steps {
               // Cloning the repo by Jenkins automatically
                echo 'Code checked out from SCM.'
            }
        }

        // --- Auth Service Pipeline ---
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
                dir('microservices/auth-service') { 
                    echo 'Testing Auth Service...'
                    sh 'npm test' 
                }
            }
        }

        stage('Containerize Auth Service') {
            steps {
                script {
                    echo 'Containerizing Auth Service...'
                    
                    def authServiceImage = docker.build("gworld1/auth-service:${env.BUILD_NUMBER}", "microservices/auth-service")
                    
                    echo "Docker image built for Auth Service: ${authServiceImage.id}"
                    
                }
            }
        }

        // --- Comment Service Pipeline ---
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
                dir('microservices/comment-service') {
                    echo 'Testing Comment Service...'
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
                }
            }
        }

        // --- Like Service Pipeline ---
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
                dir('microservices/like-service') {
                    echo 'Testing Like Service...'
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
                }
            }
        }

        // --- Post Service Pipeline ---
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
                dir('microservices/post-service') {
                    echo 'Testing Post Service...'
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
                }
            }
        }
    }

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
