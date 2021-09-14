/*
 * File: index.ts
 * Created Date: Aug 16, 2021
 * Copyright (c) 2021 Zeytech Inc. (https://zeytech.com)
 * Author: Steve Krenek (https://github.com/skrenek)
 * -----
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Addons/Zeytech/FileUploads' {
  // import { DateTime } from 'luxon'
  // import { HasMany, LucidModel } from '@ioc:Adonis/Lucid/Orm'
  import { FileUploadError } from '@ioc:Adonis/Core/BodyParser'
  import { RouteContract } from '@ioc:Adonis/Core/Route'

  export interface FileUploadsConfig {
    apiEndpointPrefix?: string
    apiBaseEndpoint?: string
    defaultStoragePath: string
    downloadBaseUrl: string
    enableDownloads: boolean
  }

  export enum StorageType {
    local = 'local',
    s3 = 's3',
  }

  export interface FileUploadResultContract {
    result: 'success' | 'failed'
    originalFilename: string
    destinationFilename: string
    size: number
    errors?: FileUploadError[]
    expiration?: string
  }

  export interface RouteHelper {
    getRoute(routeName: string): RouteContract | undefined
  }

  // export interface FileUploadEndpointContract extends LucidModel {
  //   id: number
  //   createdAt: DateTime
  //   updatedAt: DateTime
  //   uri: string
  //   endpointName: string
  //   filenameFormat: string | null
  //   maxFileSizeBytes: number
  //   accept: string | null
  //   multipleFilesEnabled: boolean
  //   storageType: StorageType
  //   storagePath: string
  //   autoExpirationEnabled: boolean
  //   autoExpirationSeconds: number | null
  //   completionEventName: string | null
  //   histories: HasMany<FileUploadHistoryContract>
  //   webhooks: HasMany<FileUploadWebhookContract>
  // }

  // export interface FileUploadHistoryContract extends LucidModel {
  //   id: number
  //   createdAt: DateTime
  //   updatedAt: DateTime
  //   fileSizeBytes: number
  //   filename: string
  //   deletedAt: DateTime | null
  //   fileUploadEndpointId: number
  // }

  // export interface FileUploadWebhookContract extends LucidModel {
  //   id: number
  //   createdAt: DateTime
  //   updatedAt: DateTime
  //   fileUploadEndpointId: number
  //   webhookUrl: string
  //   description: string | null
  // }
}
