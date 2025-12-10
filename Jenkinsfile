pipeline {
    agent any

    triggers {
        // Check repo every 2 minutes for new commits
        pollSCM('H/2 * * * *')
    }

    parameters {
        booleanParam(
            name: 'CLEAN_VOLUMES',
            defaultValue: false,
            description: 'Run docker compose down -v before deploying (reset DB)'
        )
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Prepare .env') {
            steps {
                script {
                    // Create these Secret text credentials in Jenkins:
                    //  - MYSQL_ROOT_PASSWORD
                    //  - MYSQL_PASSWORD
                    withCredentials([
                        string(credentialsId: 'MYSQL_ROOT_PASSWORD', variable: 'MYSQL_ROOT_PASS'),
                        string(credentialsId: 'MYSQL_PASSWORD',      variable: 'MYSQL_PASS')
                    ]) {
                        sh '''
                          cat > .env <<EOF
                          MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASS}
                          MYSQL_DATABASE=user_form_db
                          MYSQL_USER=app_user
                          MYSQL_PASSWORD=${MYSQL_PASS}
                          MYSQL_PORT=3306
                          DB_PORT=3306
                          API_PORT=3001
                          FRONTEND_PORT=3000
                          PHPMYADMIN_PORT=8888
                          NEXT_PUBLIC_API_HOST=http://localhost:3001
                          EOF
                        '''
                    }
                }
            }
        }

        stage('Validate Compose') {
            steps {
                sh 'docker compose config'
            }
        }

        stage('Build') {
            steps {
                sh 'docker compose build'
            }
        }

        stage('Deploy') {
            steps {
                script {
                    def downCmd = params.CLEAN_VOLUMES ?
                        'docker compose down -v || true' :
                        'docker compose down || true'

                    sh """
                      ${downCmd}
                      docker compose up -d
                    """
                }
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                  echo "Waiting for services to start..."
                  sleep 20

                  echo "Checking API health..."
                  curl -f http://localhost:3001/health

                  echo "Checking products endpoint..."
                  curl -f http://localhost:3001/users

                  echo "Health check passed."
                '''
            }
        }
    }

    post {
        success {
            echo "User Form CI/CD pipeline finished successfully."
        }
        failure {
            echo "Pipeline failed. Showing last logs..."
            sh 'docker compose logs --tail=50 || true'
        }
    }
}