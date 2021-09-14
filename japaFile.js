/*
 * File: japaFile.js
 * Created Date: Aug 16, 2021
 * Copyright (c) 2021 Zeytech Inc. (https://zeytech.com)
 * Author: Steve Krenek (https://github.com/skrenek)
 * -----
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

require('@adonisjs/require-ts/build/register')

const { configure } = require('japa')

configure({
  files: ['test/**/*.spec.ts'],
})
