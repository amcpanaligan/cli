import * as path from 'path'
import * as Generator from 'yeoman-generator'

import {CogGeneratorArgs} from '../services/cog-generator'

class CogGenerator extends Generator {
  constructor(args: any, public options: CogGeneratorArgs) {
    super(args, options)
  }

  writing() {
    this._printStepBanner('Scaffolding Cog')

    if (this.options.name) {
      this.options.packageSafeName = this._getSlugSafeVersionOf(this.options.name)
    }

    if (this.options.name && this.options.org) {
      const safeOrg = this._getSlugSafeVersionOf(this.options.org)
      this.options.machineName = `${safeOrg}/${this.options.packageSafeName}`
    }

    this.sourceRoot(path.join(__dirname, `../assets/templates/${this.options.language}`))

    // Always copy the cog.proto into the same location, regardless of language.
    this.fs.copy(this.templatePath('../../proto/cog.proto'), this.destinationPath('proto/cog.proto'))

    // If configured, copy the license file into the same location as well.
    if (this.options['include-mit-license']) {
      this.fs.copyTpl(this.templatePath('../LICENSE.mit.ejs'), this.destinationPath('LICENSE'), this)
    }

    switch (this.options.language) {
    case 'typescript':
      this._writingTypescript()
    }
  }

  install() {
    let startCommand = ''
    this._printStepBanner('Loading Cog Dependencies')

    switch (this.options.language) {
    case 'typescript':
      startCommand = 'npm start'
      this.spawnCommandSync('npm', ['install'])
    }

    this._printStepBanner(`$ crank cog:install --source=local --local-start-command="${startCommand}" --debug`)
    this._crankInstallCog(this.options.machineName || '', startCommand)
    this._printStepBanner(`$ crank cog:readme ${this.options.machineName || ''}`)
    this._crankUpdateReadme(this.options.machineName || '')
  }

  end() {
    this._printStepBanner(`All Done! Try It Out:  $ crank cog:step ${this.options.machineName}`)
  }

  private _getSlugSafeVersionOf(string: string): string {
    const slugSafeString = string
    return slugSafeString.replace(/[\s]+/g, '-')
      .replace(/[^a-zA-Z0-9\-]+/g, '')
      .toLowerCase()
  }

  private _printStepBanner(stepName: string) {
    const length = Math.max(stepName.length, 80)
    this.log(`\n${'='.repeat(length)}`)
    this.log(stepName)
    this.log(`${'='.repeat(length)}\n`)
  }

  private _crankInstallCog(cogName: string, startCommand: string): void {
    this.log()
    this.spawnCommandSync('crank', ['cog:install', '--source=local', cogName, '--local-start-command', startCommand, '--debug'])
  }

  private _crankUpdateReadme(cogName: string): void {
    this.log()
    this.spawnCommandSync('crank', ['cog:readme', cogName])
  }

  private _writingTypescript() {
    // Copy root files.
    this.fs.copy(this.templatePath('.gitignore'), this.destinationPath('.gitignore'))
    this.fs.copy(this.templatePath('.dockerignore'), this.destinationPath('.dockerignore'))
    this.fs.copy(this.templatePath('tslint.json'), this.destinationPath('tslint.json'))
    this.fs.copy(this.templatePath('tsconfig.json'), this.destinationPath('tsconfig.json'))
    this.fs.copyTpl(this.templatePath('package.json.ejs'), this.destinationPath('package.json'), this)
    this.fs.copyTpl(this.templatePath('Dockerfile.ejs'), this.destinationPath('Dockerfile'), this)
    this.fs.copyTpl(this.templatePath('README.md.ejs'), this.destinationPath('README.md'), this)
    this.fs.copyTpl(this.templatePath('.circleci/config.yml.ejs'), this.destinationPath('.circleci/config.yml'), this)

    // Copy scripts files.
    this.fs.copy(this.templatePath('scripts'), this.destinationPath('scripts'))

    // Copy core files.
    this.fs.copy(this.templatePath('src/core/grpc-server.ts'), this.destinationPath('src/core/grpc-server.ts'))
    this.fs.copy(this.templatePath('src/core/base-step.ts'), this.destinationPath('src/core/base-step.ts'))
    this.fs.copy(this.templatePath('src/core/cog.ts'), this.destinationPath('src/core/cog.ts'))

    // Copy client files.
    this.fs.copy(this.templatePath('src/client/client-wrapper.ts'), this.destinationPath('src/client/client-wrapper.ts'))

    // Copy proto files (all of them, because this CLI is also written in TS).
    this.fs.copy(this.templatePath('../../../proto'), this.destinationPath('src/proto'))

    // Copy primary test files.
    this.fs.copyTpl(this.templatePath('test/core/cog.ts.ejs'), this.destinationPath('test/core/cog.ts'), this)
    this.fs.copy(this.templatePath('test/client'), this.destinationPath('test/client'))

    // If sample steps were requested, add them!
    if (this.options['include-example-step']) {
      this.fs.copy(this.templatePath('src/steps'), this.destinationPath('src/steps'))
      this.fs.copy(this.templatePath('test/steps'), this.destinationPath('test/steps'))
    } else {
      // Otherwise, at least make the directories.
      this.fs.write(this.destinationPath('src/steps/.gitkeep'), '')
      this.fs.write(this.destinationPath('test/steps.gitkeep'), '')
    }
  }

}

export = CogGenerator
