import { cuid } from '@poppinss/utils/build/helpers'
import { basename } from 'path'

import { DateTime } from 'luxon'

export default class FileManager {
  /**
   *
   * @param originalFilename
   * @param format
   * @param extension
   * @returns string updated filename
   */
  public static processFilenameFormat(
    originalFilename: string,
    format: string | null,
    extension = ''
  ): string {
    if (!format) {
      // if no format provided, simply return the original
      return originalFilename
    }
    // supported tokens: cuid, timestamp, original, ext
    let output = format
      .replace('{cuid}', cuid())
      .replace('{timestamp}', DateTime.now().toFormat('yyyy-MM-ddTHHmmss_SSS'))
      .replace(
        '{original}',
        basename(
          originalFilename,
          extension !== '' && extension.indexOf('.') < 0 ? `.${extension}` : extension
        )
      )
      .replace('{ext}', extension)
    return output
  }

  /**
   * Gets an expiration date string at now plus number of seconds
   * @param seconds number of seconds until expiration
   * @returns string in ISO8601 standard date format
   */
  public static getExpirationDate(seconds: number): string {
    return DateTime.now().plus({ seconds }).toISO()
  }
}
