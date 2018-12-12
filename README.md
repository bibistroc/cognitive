# Cognitive

[![Build Status](https://dev.azure.com/gabrielbarbu/cognitive/_apis/build/status/cognitive-CI?branchName=master)](https://dev.azure.com/gabrielbarbu/cognitive/_build/latest?definitionId=7?branchName=master) [![Deployment Status](https://vsrm.dev.azure.com/gabrielbarbu/_apis/public/Release/badge/bbe05c92-e772-4eca-b25c-4c8380688e64/1/1)](https://github.com/bibistroc/cognitive/releases)

# Prerequisites
1. In order to use the application you need to deploy two resources into Azure:
- Face: you can click the following button to deploy the resource:

[![Deploy Face API](https://azuredeploy.net/deploybutton.png)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fbibistroc%2Fcognitive%2Fmaster%2Fazure%2Ffaceapi.azuredeploy.json)

- Custom Vision: you can click the following button to deploy the resource:

[![Deploy Custom Vision](https://azuredeploy.net/deploybutton.png)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fbibistroc%2Fcognitive%2Fmaster%2Fazure%2Fcustomvision.azuredeploy.json)

2. Download the training data:
- Training data for face: [download](https://github.com/bibistroc/cognitive/blob/master/assets/face-mask/training-data.zip?raw=true)
- Training data for lego conveyor: [download](https://github.com/bibistroc/cognitive/blob/master/assets/lego-conveyor/training-data.zip?raw=true)
3. Install docker toolbox (used for the conveyor):
- Method 1: using [chocolatey](https://chocolatey.org) run: `choco install docker-toolbox `
- Method 2: download & install it from [official website](https://docs.docker.com/toolbox/toolbox_install_windows/)
4. Download the latest release of the application from [here](https://github.com/bibistroc/cognitive/releases/latest)

# Face mask
The detailed instructions on how to setup and use are [here](./FACEAPI.md)

# Lego conveyor
The detailed instructions on how to setup and use are [here](./LEGOCONVEYOR.md)