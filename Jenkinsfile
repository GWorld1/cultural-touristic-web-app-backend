pipeline {
    agent any

    tools {
        git 'Default'
        nodejs 'JenkinsNodeJS'
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo 'Code checked out from SCM.'
            }
        }

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
                    def authServiceImage = docker.build("gworld1/auth-service:${env.BUILD_NUMBER}", "microservices/auth-service")
                    echo "Docker image built for Auth Service: ${authServiceImage.id}"
                }
            }
        }

        stage('Build Comment Service') {
            steps {
                dir('microservices/comment-service') {
                    echo 'Building Comment Service...'
                    sh 'npm install'
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

        stage('Build Like Service') {
            steps {
                dir('microservices/like-service') {
                    echo 'Building Like Service...'
                    sh 'npm install'
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

        stage('Build Post Service') {
            steps {
                dir('microservices/post-service') {
                    echo 'Building Post Service...'
                    sh 'npm install'
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
