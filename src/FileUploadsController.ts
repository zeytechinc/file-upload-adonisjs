/*
 * File: FileUploadsController.ts
 * Created Date: Aug 16, 2021
 * Copyright (c) 2021 Zeytech Inc. (https://zeytech.com)
 * Author: Steve Krenek (https://github.com/skrenek)
 * -----
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { Exception } from '@adonisjs/core/build/standalone'
import { ConfigContract } from '@ioc:Adonis/Core/Config'
import { LoggerContract } from '@ioc:Adonis/Core/Logger'
import { EmitterContract } from '@ioc:Adonis/Core/Event'
import { FileValidationOptions, MultipartFileContract } from '@ioc:Adonis/Core/BodyParser'
import { isAbsolute, join } from 'path'
import fs from 'fs/promises'
import { constants } from 'fs'
import FileManager from './FileManager'
import { FileUploadResultContract, StorageType } from './Contracts'
import axios from 'axios'
import { DatabaseContract, TransactionClientContract } from '@ioc:Adonis/Lucid/Database'

export default class FileUploadsController {
  /* This controller class accepts the endpoint model as a constructor parameter because
   * at boot time the class does not have access to @ioc imports directly.  As such, we
   * have to use other means in the provider class to look up the proper classes and pass
   * them in.
   */
  constructor(
    protected database: DatabaseContract,
    protected endpointModel: any, //typeof FileUploadEndpoint,
    protected historyModel: any, // typeof FileUploadHistory,
    protected event: EmitterContract,
    protected config: ConfigContract,
    protected appTmpPath: string
  ) {}

  public async index({ request }: HttpContextContract) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { sort, sort_dir } = request.qs()
    let query = this.endpointModel.query()
    if (sort || sort_dir) {
      query = query.orderBy(sort || 'endpointName', sort_dir || 'asc')
    }
    query.preload('webhooks')
    return await query.exec()
  }

  public async show({ params }: HttpContextContract) {
    const { id } = params
    const data = await this.endpointModel
      .query()
      .where('id', id)
      .preload('webhooks')
      .preload('histories')
      .first()
    if (!data) {
      throw new Exception(`No record found for ${id}`, 400, 'E_FUA_NOT_FOUND')
    }
    return data
  }

  public async store({ request, response }: HttpContextContract) {
    const body = request.body()
    const saved = await this.endpointModel.create(body)
    const endpoint = await this.endpointModel
      .query()
      .where('id', saved.id)
      .preload('histories')
      .preload('webhooks')
      .first()
    response.created(endpoint)
  }

  public async update({ params, request }: HttpContextContract) {
    const body = request.body()
    const { id } = params
    const existing = await this.endpointModel.find(id)
    if (!existing) {
      throw new Exception(`No record found for ${id}`, 400, 'E_AFU_NOT_FOUND')
    }
    existing.merge(body)
    return await existing.save()
  }

  public async destroy({ params }: HttpContextContract) {
    const { id } = params
    const trx: TransactionClientContract = await this.database.transaction()
    try {
      const endpoint = await this.endpointModel.find(id, { client: trx })
      if (!endpoint) {
        throw new Exception(`No record found for ${id}`, 400, 'E_FUA_NOT_FOUND')
      }
      const webhookDelete = trx
        .from('file_upload_webhooks')
        .where('file_upload_endpoint_id', endpoint.id)
        .delete()
        .exec()

      await endpoint.load('histories')
      for (const history of endpoint.histories) {
        // delete the file behind the history if it exists
        if (endpoint.storageType === StorageType.local) {
          try {
            await fs.access(history.filename, constants.F_OK)
            await fs.rm(history.filename)
          } catch (ignoredError) {
            // if it doesn't exist, nothing to do
          }
        }
      }
      const historyDelete = trx
        .from('file_upload_histories')
        .where('file_upload_endpoint_id', endpoint.id)
        .delete()
        .exec()
      const endpointDelete = endpoint.useTransaction(trx).delete()
      await Promise.all([webhookDelete, historyDelete, endpointDelete])
      await trx.commit()
    } catch (err) {
      await trx.rollback()
      throw err
    }
  }

  public async upload({ params, request, logger, response }: HttpContextContract) {
    const { endpoint_uri: endpointUri } = params
    const endpoint = await this.endpointModel
      .query()
      .where('uri', endpointUri)
      .preload('webhooks')
      .first()
    if (!endpoint) {
      throw new Exception(`No record found for ${endpointUri}`, 400, 'E_FUA_NOT_FOUND')
    }
    const fileValidationOptions: Partial<FileValidationOptions> = {}
    if (endpoint.accept) {
      fileValidationOptions.extnames = endpoint.accept.split(',')
    }
    if (endpoint.maxFileSizeBytes > 0) {
      fileValidationOptions.size = endpoint.maxFileSizeBytes
    }

    let files: MultipartFileContract[] = []
    if (endpoint.multipleFilesEnabled) {
      files = request.files('file_upload', fileValidationOptions)
    } else {
      const file = request.file('file_upload')
      if (file) {
        files.push(file)
      }
    }
    const results: FileUploadResultContract[] = []

    for (const file of files) {
      const result: FileUploadResultContract = {
        originalFilename: file.clientName,
        result: 'success',
        size: file.size,
        destinationFilename: '',
      }
      if (!file.isValid) {
        result.errors = file.errors
        result.result = 'failed'
      } else {
        if (endpoint.autoExpirationEnabled && endpoint.autoExpirationSeconds) {
          result.expiration = FileManager.getExpirationDate(endpoint.autoExpirationSeconds)
        }
        const renameTo = FileManager.processFilenameFormat(
          file.clientName,
          endpoint.filenameFormat,
          file.extname
        )
        result.destinationFilename = renameTo

        let storagePath: string =
          endpoint.storagePath || this.config.get('file-uploads.defaultStoragePath', 'uploads')

        if (endpoint.storageType === StorageType.local) {
          await this.processLocalUpload(endpoint, storagePath, result, file)
        }
        try {
          const historyRec = await this.historyModel.create({
            fileSizeBytes: result.size,
            filename: join(storagePath, result.destinationFilename),
            fileUploadEndpointId: endpoint.id,
          })
          const eventPayload = {
            historyRecord: historyRec,
            requestBody: request.body(),
          }
          for (const webhook of endpoint.webhooks) {
            this.processWebhook(
              endpoint,
              webhook,
              result,
              historyRec,
              logger,
              eventPayload.requestBody
            )
          }
          this.event.emit('fua:upload', eventPayload)
          if (endpoint.completionEventName) {
            this.event.emit(endpoint.completionEventName, eventPayload)
          }
        } catch (err) {
          throw err
        }
      }
      results.push(result)
    }
    return response.ok(results)
  }

  public async download({ params, response }: HttpContextContract) {
    const { history_id: historyId } = params
    const history = await this.historyModel.find(historyId)
    if (!history || history.deletedAt) {
      throw new Exception('Download not found', 400, 'E_FUA_NOT_FOUND')
    }
    const endpoint = await this.endpointModel.find(history.fileUploadEndpointId)
    if (endpoint.storageType === StorageType.local) {
      return response.download(history.filename)
    } else {
      // TODO: Handle other storage types.
      return response.notImplemented('Not yet implemented')
    }
  }

  private async processLocalUpload(
    endpoint: any,
    storagePath: string,
    result: FileUploadResultContract,
    file: MultipartFileContract
  ) {
    if (!isAbsolute(storagePath)) {
      storagePath = join(this.appTmpPath, storagePath)
    }
    try {
      await file.move(storagePath, {
        name: result.destinationFilename,
        overwrite: endpoint.overwrite,
      })
    } catch (moveErr) {
      if (moveErr.message.indexOf('already exists') >= 0 && !endpoint.overwrite) {
        result.result = 'failed'
        result.errors = [
          {
            clientName: file.clientName,
            fieldName: file.fieldName,
            message: `${result.destinationFilename} already exists and overwrite is not on for this endpoint`,
            type: 'fatal',
          },
        ]
      } else {
        throw moveErr
      }
    }
  }

  private async processWebhook(
    endpoint: any,
    webhook: any,
    result: FileUploadResultContract,
    historyRec: any,
    logger: LoggerContract,
    requestBody: any
  ) {
    const url = webhook.webhookUrl
    const apiPrefix = this.config.get('file-uploads.apiEndpointPrefix', '')
    const apiBaseEndpoint = this.config.get('file-uploads.apiBaseEndpoint', 'uploads')
    let downloadUrl = `${this.config.get('file-uploads.downloadBaseUrl')}`
    if (apiPrefix) {
      downloadUrl += `/${apiPrefix}`
    }
    downloadUrl += `/${apiBaseEndpoint}/${endpoint.id}/download/${historyRec.id}`
    const payload: any = {
      endpointName: endpoint.endpointName,
      filename: result.destinationFilename,
      size: result.size,
      expires: result.expiration,
      requestBody: requestBody,
    }
    const downloadsEnabled = this.config.get('file-uploads.enableDownloads', false) === true
    if (downloadsEnabled) {
      payload.url = downloadUrl
    }

    try {
      const webhookResponse = await axios.post(url, payload)
      if (webhookResponse.status >= 400) {
        logger.error(
          'webhook failure for endpoint %s, history id %s to url %s; webhook response %o',
          [endpoint.id, historyRec.id, url, webhookResponse]
        )
      }
    } catch (err) {
      logger.error(
        'webhook exception for endpoint %s, history id %s to url %s; error %o',
        endpoint.id,
        historyRec.id,
        url,
        err
      )
    }
  }
}
