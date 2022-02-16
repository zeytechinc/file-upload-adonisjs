<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## Table of contents

- [@zeytech/file-upload-adonisjs](#zeytechfile-upload-adonisjs)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Features](#features)
  - [Overview](#overview)
    - [Additions to Your Project](#additions-to-your-project)
    - [Routes](#routes)
  - [Usage](#usage)
    - [Setup](#setup)
    - [Config File](#config-file)
    - [Applying Middleware to Provided Routes](#applying-middleware-to-provided-routes)
    - [Listening to Upload Events](#listening-to-upload-events)
    - [File Upload Endpoint Properties](#file-upload-endpoint-properties)
    - [Webhooks](#webhooks)
    - [Filename Formats](#filename-formats)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# @zeytech/file-upload-adonisjs

[![npm-image]][npm-url] [![license-image]][license-url] [![typescript-image]][typescript-url]

This package provides database-driven file uploads for AdonisJS applications.  It builds on the mechanisms already available in AdonisJS to provide a nearly end-to-end dynamic file upload system managed via database records.

## Prerequisites

* AdonisJS Lucid module, configured with a data source

## Installation

`npm install @zeytech/file-upload-adonisjs`

`node ace configure @zeytech/file-upload-adonisjs`

## Features

* Complete API for managing file upload endpoints themselves.  Use API calls or manipulate the database directly; it's your choice
* Tracks upload history in the database
* Installs database models locally so they can be easily customized to meet your needs
* Local storage mechanism provided; others planned for the future through the AdonisJS Drive module
* Optionally download previously uploaded files
* Call webhooks when uploads complete
* Send AdonisJS events when uploads complete

## Overview

### Additions to Your Project

This module generates the following files in your project when configured.

* Three ORM models for use by the module
* Database migration files for the three models.
* If missing, contracts/events.ts file.  If it already exists, provides instructions for modifications to it
* Config file for the module

### Routes

In addition, it provides a configurable set of routes (`/uploads/*` by default) that will be available after configuration.  The route group has the name `fua` in AdonisJS.

* GET /uploads - (*index*) retrieve a list of file upload endpoints
* GET /uploads/:id - (*show*) retrieve a single file upload endpoint in full detail
* POST /uploads - (*store*) create a new file upload endpoint
* PUT /uploads/:id (*update*) update an existing file upload endpoint
* DELETE /uploads/:id (*destroy*) delete an existing file upload endpoint, its history, and remove any existing files uploaded to that endpoint
* POST /uploads/:endpoint_uri (*upload*) Upload a file(s) to a file upload endpoint
* GET /uploads/:endpoint_uri/download/:history_id (*download*) download a previously uploaded file via its upload history id

## Usage

### Setup

After installation, run the provided database schema migrations to add the necessary tables to your database.

### Config File

| Config Property Name | Default Value           | Description                                                  |
| -------------------- | ----------------------- | ------------------------------------------------------------ |
| apiEndpointPrefix    | '' (empty string)       | The prefix to use before all file upload api endpoints.  Example, if set to 'abc', all upload endpoints will be available at /abc/uploads... |
| apiBaseEndpoint      | 'uploads'               | The base endpoint name to use for all file upload api endpoints.  For example, in PUT /uploads/:id, "uploads" is the base endpoint. |
| defaultStoragePath   | '/tmp/uploads'          | The default local path to store upload files at if one is not specified on an endpoint.  If this is a relative path, it will be made relative to `Application.tmpPath`. |
| enableDownloads      | true                    | Whether or not to enable downloading previously uploaded files.  Controls whether or not the download API endpoint is registered on startup. |
| downloadBaseUrl      | 'http://localhost:3333' | The base url to use when sending webhook requests out for the download url to the file.  Only relevant if enableDownloads is set to true. |

### Applying Middleware to Provided Routes

If you need to apply middleware to the provided routes, you can use the included helper class to do so.  See the example below.

```typescript
import Route from '@ioc:Adonis/Core/Route'
import { FuaRouteHelper } from '@zeytech/adonis-file-upload/build/standalone'

// Apply middleware to a specific route
FuaRouteHelper.getRoute(Route.routes, 'fua.index')?.middleware('some-middleware')

// Apply middleware to the entire route group
FuaRouteHelper.getRouteGroup(Route.routes)?.middleware('some-middleware')
```

### Listening to Upload Events

Built-in Events

"fua:upload" - This event is emitted after every file upload regardless of endpoint.  The data emitted with the event is an instance of the history database record, whose relevant properties are listed below.

* id - primary key; use this in routes where history_id is required
* createdAt, updatedAt - standard timestamps
* fileSizeBytes - the file size in bytes
* filename - the filename on the server / storage mechanism
* fileUploadEndpointId - id of the file upload endpoint this upload was sent to

In addition, each endpoint can emit its own event if it wishes.  Simply set the `completionEventName` property.  Events emmitted in this manner will have the same data as above.  Note that you may also want to [register these events](https://docs.adonisjs.com/guides/events#making-events-type-safe) in your contracts/events.ts file if you want type safety around them.

### File Upload Endpoint Properties

| Property Name         | Description                                                  |
| --------------------- | ------------------------------------------------------------ |
| uri                   | the partial uri to use in upload routes                      |
| endpointName          | human friendly name of the endpoint                          |
| filenameFormat        | filename format string to use when renaming uploaded files   |
| overwrite             | whether or not to overwrite existing files or fail the upload |
| maxFileSizeBytes      | the max uploaded file size allowed for this endpoint         |
| accept                | comma-delimited list of extensions allowed for this endpoint |
| multipleFilesEnabled  | whether or not multiple files will be accepted in a single upload |
| storageType           | local or s3.  local only for now.  s3 is planned             |
| storagePath           | for local storage, the path on the server to save uploaded files to.  For s3, the bucket prefix to use |
| autoExpirationEnabled | whether or not to auto-delete files after they expire (needs implementation yet) |
| autoExpirationSeconds | how many seconds after upload files expire if auto expiration is enabled |
| completionEventName   | if set, the event name to fire when an upload occurs         |

### Webhooks

You can also attach webhooks to endpoints via the database.  When a file upload occurs, if the endpoint has configured webhooks for the upload result type (sucess or failure), these URLs will be called via POST with the following payload:

```typescript
{
  endpointName: string
  filename: string
  size: number // file size in bytes
  expires: string // ISO8601 timestamp
  url? string // URL to download file, if successful and downloads are enabled
}
```

### Filename Formats

File upload endpoint's filenameFormat supports several mustache-like (`{variable}`) placeholders as described below.

* {cuid} - collision resistant id. See [AdonisJS's docs](https://docs.adonisjs.com/guides/helpers#cuid) on it.
* {timestamp} - inserts an ISO8601-*like* timestamp in the form yyyy-MM-ddTHHmmss_SSS
* {original} - inserts the original uploaded filename, minus the extension
* {ext} - inserts the uploaded file's extension

Examples:

* Upload `dsc_0123456789.jpg` ⇒  `my-file-{cuid}.jpg` ⇒ `my-file-cktvtwhlx0000r8o7au9006sg.jpg`
* Upload `anything.png` ⇒ `some-file-{timestamp}.png` ⇒ `some-file-2021-09-22T131842_123.png`
* Upload `lotsa-data.csv` ⇒ `{original}_{timestamp}.csv` ⇒ `lotsa-data_2021-09-22T131922_456.csv`
* Upload `home-movie.mp4` ⇒ `some-upload.{ext}` ⇒ `some-upload.mp4`

----



[npm-image]: https://img.shields.io/npm/v/@zeytech/file-upload-adonisjs.svg?style=for-the-badge&logo=npm
[npm-url]: https://npmjs.org/package/@zeytech/file-upload-adonisjs "npm"

[license-image]: https://img.shields.io/npm/l/@zeytech/file-upload-adonisjs?color=blueviolet&style=for-the-badge
[license-url]: LICENSE.md "license"

[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
[typescript-url]:  "typescript"
