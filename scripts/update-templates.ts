/*
 * File: update-templates.ts
 * Created Date: Aug 16, 2021
 * Copyright (c) 2021 Zeytech Inc. (https://zeytech.com)
 * Author: Steve Krenek (https://github.com/skrenek)
 * -----
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { basename, join, resolve } from 'path'
import * as sinkStatic from '@adonisjs/sink'

const rootDir = resolve(__dirname, '..')

// Copy app/Models/* to Models templates.
const modelSrcDir = join(rootDir, 'src/Models')
const modelTemplateDir = join(rootDir, 'templates/Models')

const updateTemplate = function (templatePath: string, destinationDir: string) {
  const destFilename = `${basename(templatePath, '.ts')}.txt`
  const template = new sinkStatic.files.MustacheFile(destinationDir, destFilename, templatePath)
  template.overwrite = true
  const action = template.exists() ? 'update' : 'create'
  template.apply().commit()
  sinkStatic.logger.action(action).succeeded(join(destinationDir, destFilename))
}

updateTemplate(join(modelSrcDir, 'FileUploadEndpoint.ts'), modelTemplateDir)
updateTemplate(join(modelSrcDir, 'FileUploadHistory.ts'), modelTemplateDir)
updateTemplate(join(modelSrcDir, 'FileUploadWebhook.ts'), modelTemplateDir)

// Copy migrations to templates
const migrationSrcDir = join(rootDir, 'database/migrations')
const migrationTemplateDir = join(rootDir, 'templates/migrations')
updateTemplate(join(migrationSrcDir, 'file_upload_endpoints.ts'), migrationTemplateDir)
updateTemplate(join(migrationSrcDir, 'file_upload_histories.ts'), migrationTemplateDir)
updateTemplate(join(migrationSrcDir, 'file_upload_webhooks.ts'), migrationTemplateDir)
