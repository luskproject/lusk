<p align="center"><picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/8b750a5e-2c4d-42ae-a67c-3a0cb48b6889">
  <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/2247cca5-3270-4966-9a8d-25f33ef5fca8">
  <img src="https://github.com/user-attachments/assets/2247cca5-3270-4966-9a8d-25f33ef5fca8" />
</picture></p>

<p align="center">
  <img src="https://img.shields.io/github/commit-activity/w/luskproject/lusk?style=flat-square&label=Commit%20Activity&labelColor=%23202020&color=%23C0C0C0&cacheSeconds=10" />
  <img src="https://img.shields.io/github/issues/luskproject/lusk?style=flat-square&label=Open%20Issues&labelColor=%23202020&color=%23C0C0C0&cacheSeconds=10" />
  <img src="https://img.shields.io/github/license/luskproject/lusk?style=flat-square&label=License&labelColor=%23202020&color=%23C0C0C0&cacheSeconds=10" />
</p>
Lusk is a modular, plugin-based project manager. It is simple, based on a human-readable document format called YAML. It has a built-in plugin manager to add, remove or configure plugins. You can use Lusk to automate your build procedures, create templates and more. It is based on <a href="https://github.com/apidevel/transit-proposal/blob/main/PROPOSAL-VERSION_1.md">Transit Plugin Architecture Version 1</a>, absolutely extended beyond it's definitions.

### Installation
You need Node.JS v20 or later. You can run the command below to install Lusk:
```
npm install -g lusk
```

### Usage
To see the built-in help page, please run the command below:
```
lusk help
```
After checking in the help page, go to the project that you want to use lusk and test it. Here's an example preset document (`lusk.yaml`) for you to test:
```yaml
default:
    action: os.shell
    cmdlines:
        - echo Hello World
```
After writing this to a file, Execute the preset by running this in the command line:
```
lusk make
```
and you should see a `Hello World` message.

### Beyond the boundaries
To see more details, please visit https://github.com/luskproject/lusk/wiki
