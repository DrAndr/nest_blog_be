# File Upload Module

A production-ready file upload module built with **NestJS + Prisma**.

This module provides:

-   File upload handling
-   Image processing
-   Image variants generation (thumbnail, small, medium, large)
-   Blurhash + dominant color extraction
-   Checksum-based duplicate prevention
-   Transaction-safe database operations
-   Storage abstraction layer

------------------------------------------------------------------------

# Architecture Overview

The module follows a layered architecture:

    Controller
       ↓
    Service (UploadFilesService)
       ↓
    Infrastructure Services:
       - FilePathService
       - FileProcessService
       - FileStorageService
       - FileVariantsService
       ↓
    Prisma (Database)

### Responsibilities

## UploadFilesService

Main orchestration service: - Handles transactions - Prevents duplicate
uploads - Saves physical files - Stores metadata - Triggers variant
creation

## FileProcessService

-   Checksum generation
-   Image metadata extraction
-   Blurhash generation
-   Dominant color extraction
-   Image resizing (WebP)

## FileStorageService

-   Saves files
-   Deletes files
-   Gets file stats
-   Abstracted from physical storage (local FS, future S3)

## FileVariantsService

-   Generates image variants
-   Stores variant metadata
-   Uses Promise.all for parallel processing

------------------------------------------------------------------------

# How It Works

1.  File buffer received
2.  Checksum generated
3.  Duplicate check performed
4.  File stored physically
5.  Metadata extracted
6.  DB record created
7.  Image variants generated (if image)

All wrapped inside a Prisma transaction.

------------------------------------------------------------------------

# Usage Example

### Upload files

``` ts
@Post()
@UseInterceptors(FilesInterceptor('files'))
uploadFiles(
  @UploadedFiles() files: Express.Multer.File[],
  @User('id') userId: string,
) {
  return this.uploadFilesService.create(files, userId);
}
```

------------------------------------------------------------------------

# Folder Structure

    upload-files/
     ├── infrastructure/
     │    ├── file-path.service.ts
     │    ├── file-process.service.ts
     │    ├── file-storage.service.ts
     │    └── file-variants.service.ts
     ├── libs/
     ├── entities/
     ├── dto/
     └── upload-files.service.ts

------------------------------------------------------------------------

# Storage Strategy

Currently implemented:

-   Local filesystem storage

Designed for extension:

-   S3-compatible storage
-   CDN-ready paths
-   Background processing

------------------------------------------------------------------------

# License

MIT
