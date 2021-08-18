import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class FileUploadHistory extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @column()
  public fileSizeBytes: number

  @column()
  public filename: string

  @column.dateTime()
  public deletedAt: DateTime | null

  @column()
  public fileUploadEndpointId: number
}