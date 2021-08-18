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
