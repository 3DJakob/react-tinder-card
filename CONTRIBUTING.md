# Welcome to React Tinder Card contributing guide

Thank you for investing your time in contributing to my project! PRs are welcome but make sure to follow the rules listed in this guide.

## Rules

### 1. Only include ONE new feature in each PR. 

If you have multiple improvements please submit multiple independent PRs.

### 2. The code has to be backward compatible. 

This repository has a large userbase and we do not want any breaking changes. That means do not change the name or arguments of the original functions. If you have a good reason for making a breaking change please clearly state that in your PR.

### 3. Always make the same change to both the React code as well as the React Native code.

This module is compatible with both React as well as React Native. While the code is different the props and API are identical. I will not merge any PRs that split the props and API.

### 4. Make sure your code passes ```npm run test```.

The test script will automatically generate props to the readme using `ts-readme-generator` and check that the code is formatted using standard. Read more about standard JS [here](https://standardjs.com).

