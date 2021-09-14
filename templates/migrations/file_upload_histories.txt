/*
 * File: file_upload_histories.ts
 * Created Date: Aug 16, 2021
 * Copyright (c) 2021 Zeytech Inc. (https://zeytech.com)
 * Author: Steve Krenek (https://github.com/skrenek)
 * -----
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class FileUploadHistories extends BaseSchema {
  protected tableName = 'file_upload_histories'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table
        .integer('file_upload_endpoint_id')
        .notNullable()
        .references('id')
        .inTable('file_upload_endpoints')
      table.integer('file_size_bytes').notNullable()
      table.string('filename', 255).notNullable()
      table.timestamp('deleted_at')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
