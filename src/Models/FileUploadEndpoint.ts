/*
 * File: FileUploadEndpoint.ts
 * Created Date: Aug 16, 2021
 * Copyright (c) 2021 Zeytech Inc. (https://zeytech.com)
 * Author: Steve Krenek (https://github.com/skrenek)
 * -----
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { DateTime } from 'luxon'
import { BaseModel, column, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm'
import FileUploadHistory from './FileUploadHistory'
import FileUploadWebhook from './FileUploadWebhook'

export enum StorageType {
  local = 'local',
  s3 = 's3',
}

export default class FileUploadEndpoint extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @column()
  public uri: string

  @column()
  public endpointName: string

  @column()
  public filenameFormat: string | null

  @column()
  public overwrite: boolean

  @column()
  public maxFileSizeBytes: number

  @column()
  public accept: string | null

  @column()
  public multipleFilesEnabled: boolean

  @column()
  public storageType: StorageType

  @column()
  public storagePath: string

  @column()
  public autoExpirationEnabled: boolean

  @column()
  public autoExpirationSeconds: number | null

  @column()
  public completionEventName: string | null

  @hasMany(() => FileUploadHistory)
  public histories: HasMany<typeof FileUploadHistory>

  @hasMany(() => FileUploadWebhook)
  public webhooks: HasMany<typeof FileUploadWebhook>
}
