/*
 * File: file_upload_endpoints.ts
 * Created Date: Aug 16, 2021
 * Copyright (c) 2021 Zeytech Inc. (https://zeytech.com)
 * Author: Steve Krenek (https://github.com/skrenek)
 * -----
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class FileUploadEndpoints extends BaseSchema {
  protected tableName = 'file_upload_endpoints'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.string('uri', 255).notNullable().unique('ix_endpoint_uri_unique')
      table
        .string('endpoint_name', 255)
        .notNullable()
        .unique('ix_endpoint_name_unique')
        .comment('display name for this endpoint')
      table.string('filename_format', 255)
      table
        .boolean('overwrite')
        .notNullable()
        .defaultTo(false)
        .comment(
          'overwrite on existing destination file name upload.  This is irrelevant if {timestamp} is used in the filename format.'
        )
      table
        .integer('max_file_size_bytes')
        .notNullable()
        .defaultTo(0)
        .comment('max upload size in bytes. Use 0 for no limit.')
      table.string('accept', 2048).comment('comma-delimited string of accepted file extensions.')
      table.boolean('multiple_files_enabled').notNullable().defaultTo(true)
      table
        .enu('storage_type', ['local', 's3'], { useNative: true, enumName: 'enu_storage_types' })
        .defaultTo('local')
      table.string('storage_path', 1024).notNullable().defaultTo('')
      table.boolean('auto_expiration_enabled').notNullable().defaultTo(false)
      table
        .integer('auto_expiration_seconds')
        .comment('when auto expiration is enabled, expire uploaded files x seconds after upload')
      table
        .string('completion_event_name', 255)
        .comment(
          'Event name to fire on successful upload.  Allows apps to process files after upload via event listeners.'
        )
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
