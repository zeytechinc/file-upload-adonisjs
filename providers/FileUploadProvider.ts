/*
 * File: FileUploadProvider.ts
 * Created Date: Aug 16, 2021
 * Copyright (c) 2021 Zeytech Inc. (https://zeytech.com)
 * Author: Steve Krenek (https://github.com/skrenek)
 * -----
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import Route from '@ioc:Adonis/Core/Route'
import Config from '@ioc:Adonis/Core/Config'
import { EmitterContract } from '@ioc:Adonis/Core/Event'
import FileUploadsController from '../src/FileUploadsController'
import { DatabaseContract } from '@ioc:Adonis/Lucid/Database'

export default class FileUploadProvider {
  constructor(protected application: ApplicationContract) {}

  public static needsApplication = true

  private initFileUploadRoutes() {
    const config: typeof Config = this.application.container.resolveBinding('Adonis/Core/Config')
    const router: typeof Route = this.application.container.resolveBinding('Adonis/Core/Route')
    const event: EmitterContract = this.application.container.resolveBinding('Adonis/Core/Event')
    const database: DatabaseContract =
      this.application.container.resolveBinding('Adonis/Lucid/Database')
    const EndpointModel = this.application.container.use('App/Models/FileUploadEndpoint')
    const EndpointHistoryModel = this.application.container.use('App/Models/FileUploadHistory')

    const apiPrefix = config.get('file-uploads.apiEndpointPrefix', '')
    const apiBaseEndpoint = config.get('file-uploads.apiBaseEndpoint', 'uploads')
    const controller = new FileUploadsController(
      database,
      EndpointModel.default,
      EndpointHistoryModel.default,
      event,
      config,
      this.application.tmpPath()
    )

    const idConverter = {
      match: /^[0-9]+$/,
      cast: (id) => Number(id),
    }

    let routeGroup = router
      .group(() => {
        router.get(`/${apiBaseEndpoint}`, controller.index.bind(controller)).as('index')
        router
          .get(`/${apiBaseEndpoint}/:id`, controller.show.bind(controller))
          .where('id', idConverter)
          .as('show')
        router.post(`/${apiBaseEndpoint}`, controller.store.bind(controller)).as('store')
        router
          .put(`/${apiBaseEndpoint}/:id`, controller.update.bind(controller))
          .where('id', idConverter)
          .as('update')
        router
          .delete(`/${apiBaseEndpoint}/:id`, controller.destroy.bind(controller))
          .where('id', idConverter)
          .as('destroy')
        router
          .post(`/${apiBaseEndpoint}/:endpoint_uri`, controller.upload.bind(controller))
          .as('upload')

        if (config.get('file-uploads.enableDownloads', false) === true) {
          router
            .get(
              `/${apiBaseEndpoint}/:endpoint_uri/download/:history_id`,
              controller.download.bind(controller)
            )
            .where('history_id', idConverter)
            .as('download')
        }
      })
      .as('afu')
    if (apiPrefix) {
      routeGroup = routeGroup.prefix(apiPrefix)
    }
  }

  public register() {}

  public async boot() {
    this.initFileUploadRoutes()
  }
}
