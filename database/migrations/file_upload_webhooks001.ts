/*
 * File: file_upload_webhooks.ts
 * Created Date: Feb 10, 2022
 * Copyright (c) 2022 Zeytech Inc. (https://zeytech.com)
 * Author: Clint Pamperin (https://github.com/cpamp)
 * -----
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class FileUploadWebhooks extends BaseSchema {
  protected tableName = 'file_upload_webhooks'

  public async up() {
    this.schema.table(this.tableName, (table) => {
      table
        .enu('webhook_type', ['success', 'failure'], {
          useNative: false,
          enumName: 'enu_fua_webhook_type',
        })
        .defaultTo('success')
    })
  }

  public async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('webhook_type')
    })
  }
}
