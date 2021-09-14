/*
 * File: index.ts
 * Created Date: Aug 17, 2021
 * Copyright (c) 2021 Zeytech Inc. (https://zeytech.com)
 * Author: Steve Krenek (https://github.com/skrenek)
 * -----
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { FileUploadError } from '@ioc:Adonis/Core/BodyParser'

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
