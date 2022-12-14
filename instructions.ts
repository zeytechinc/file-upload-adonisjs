/*
 * File: instructions.ts
 * Created Date: Aug 16, 2021
 * Copyright (c) 2021 Zeytech Inc. (https://zeytech.com)
 * Author: Steve Krenek (https://github.com/skrenek)
 * -----
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import * as sinkStatic from '@adonisjs/sink'
import { join } from 'path'
import { mkdirSync, readdirSync } from 'fs'
import color from 'kleur'

const messages: string[] = []

/**
 * Returns absolute path to the stub relative from the templates
 * directory
 */
function getStub(...relativePaths: string[]) {
  return join(__dirname, 'templates', ...relativePaths)
}

function makeModel(
  projectRoot: string,
  app: ApplicationContract,
  sink: typeof sinkStatic,
  modelName: string
) {
  const modelsDir = app.resolveNamespaceDirectory('models') || 'app/Models'
  const modelPath = join(modelsDir, `${modelName}.ts`)

  const template = new sink.files.MustacheFile(
    projectRoot,
    modelPath,
    getStub(`Models/${modelName}.txt`)
  )
  if (template.exists()) {
    sink.logger.action('create').skipped(`${modelPath} file already exists`)
    return
  }
  template.commit()
  sink.logger.action('create').succeeded(modelPath)
}

function checkMigrationExistence(migrationDir: string, migrationName: string): boolean {
  const contents = readdirSync(migrationDir)
  const regex = new RegExp(`^\\d+_${migrationName}.ts`)
  for (const filename of contents) {
    const matches = regex.test(filename)
    if (matches) {
      return true
    }
  }
  return false
}

function makeMigration(
  projectRoot: string,
  app: ApplicationContract,
  sink: typeof sinkStatic,
  migrationName
) {
  const migrationDir = app.directoriesMap.get('migrations') || 'database'
  const migrationPath = join(migrationDir, `${Date.now()}_${migrationName}.ts`)

  if (checkMigrationExistence(migrationDir, migrationName)) {
    sink.logger.action('create').skipped(`${migrationPath} file already exists`)
    return
  }

  const template = new sink.files.MustacheFile(
    projectRoot,
    migrationPath,
    getStub(`migrations/${migrationName}.txt`)
  )
  if (template.exists()) {
    sink.logger.action('create').skipped(`${migrationPath} file already exists`)
    return
  }

  template.commit()
  sink.logger.action('create').succeeded(migrationPath)
}

function copyEventsContract(projectRoot: string, sink: typeof sinkStatic) {
  const template = new sink.files.MustacheFile(
    projectRoot,
    'contracts/events.ts',
    getStub('contracts/events.txt')
  )

  if (template.exists()) {
    // give them instructions to add the event to the file
    messages.push(
      `Please add ${color.bold(
        color.green(`'upload:fua': FileUploadHistory`)
      )} to your EventList interface in contracts.`
    )
  } else {
    template.commit()
    sink.logger.action('create').succeeded('contracts/events.ts')
  }
}

export default async function instructions(
  projectRoot: string,
  app: ApplicationContract,
  sink: typeof sinkStatic
) {
  const pkg = new sink.files.PackageJsonFile(projectRoot)
  const hasLucid = !!pkg.get('dependencies.@adonisjs/lucid')
  if (!hasLucid) {
    sink.logger
      .action('dependencies')
      .failed(
        'Please install @adonisjs/lucid before installing this package.',
        '@adonisjs/lucid not found'
      )
    return
  }

  // Ensure database/migrations exists.
  mkdirSync(join(projectRoot, 'database', 'migrations'), { recursive: true })
  mkdirSync(join(projectRoot, 'app', 'Models'), { recursive: true })

  // TODO: Create models, create migrations
  makeModel(projectRoot, app, sink, 'FileUploadEndpoint')
  makeModel(projectRoot, app, sink, 'FileUploadHistory')
  makeModel(projectRoot, app, sink, 'FileUploadWebhook')

  makeMigration(projectRoot, app, sink, 'file_upload_endpoints')
  makeMigration(projectRoot, app, sink, 'file_upload_histories')
  makeMigration(projectRoot, app, sink, 'file_upload_webhooks')
  makeMigration(projectRoot, app, sink, 'file_upload_webhooks001')

  copyEventsContract(projectRoot, sink)

  messages.push(
    `Please run ${color.bold(color.green('npm install'))} to make sure dependencies are installed.`
  )
  messages.push(
    `Please run ${color.bold(
      color.green('node ace migration:run')
    )} to configure the associated db tables.`
  )

  if (messages.length) {
    const sinkInstructions = sink.instructions()
    for (const message of messages) {
      sinkInstructions.add(message)
    }
    sinkInstructions.render()
  }
}
