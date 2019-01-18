properties properties: [
        [$class: 'BuildDiscarderProperty', strategy: [$class: 'LogRotator', artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '30', numToKeepStr: '10']],
        disableConcurrentBuilds()
]

@Library('holisticon-build-library')
def build = new de.holisticon.ci.jenkins.Build()
def nodeJS = new de.holisticon.ci.jenkins.NodeJS()

def notify = new de.holisticon.ci.jenkins.Notify()

node {
    def image

    try {
        stage('Checkout') {
            deleteDir()
            checkout scm
        }

        stage('Build') {
            image = docker.build('toolisticon/oc-routes-prometheus-exporter')
            nodeJS.nvmRun('clean');
        }

        stage('Test') {
           nodeJS.nvmRun('test');
        }

        stage('Deploy') {
            // TODO NPM publish
            docker.withRegistry('https://registry-1.docker.io/v2/', 'docker-hub-holisticon') {
                image.push("${env.BUILD_NUMBER}")
            }
        }

    } catch (e) {
  //      notify.buildMessage(currentBuild, true, 'holi-oss', 'Error with recent changes: ' + build.summarizeBuild(currentBuild))
        throw e
    }

}
