import { Injectable } from '@nestjs/common';

import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
import { uuid } from 'uuidv4';

const connectionStringEnv = '';

@Injectable()
export class AppService {
  private containerName: string;

  private getBlobServiceInstance() {
    const connectionString = connectionStringEnv;
    const blobClientService =
      BlobServiceClient.fromConnectionString(connectionString);

    return blobClientService;
  }

  private getBlobClient(imageName: string): BlockBlobClient {
    const blobService = this.getBlobServiceInstance();
    const containerName = this.containerName;
    const containerClient = blobService.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(imageName);

    return blockBlobClient;
  }

  public async uploadFile(
    file: Express.Multer.File,
    containerName: string,
  ): Promise<string> {
    this.containerName = containerName;
    const extension = file.originalname.split('.').pop();
    const file_name = uuid() + '.' + extension;
    const blockBlobClient = this.getBlobClient(file_name);
    const fileUrl = blockBlobClient.url;
    await blockBlobClient.uploadData(file.buffer);

    return fileUrl;
  }

  public async getAllFile(containerName: string): Promise<any> {
    this.containerName = containerName;
    const blobService = this.getBlobServiceInstance();
    const containerClient = blobService.getContainerClient(containerName);
    const blobs = containerClient.listBlobsFlat();
    const fileUrls: string[] = [];

    for await (const blob of blobs) {
      const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
      fileUrls.push(blockBlobClient.url);
    }

    return {
      containerName: containerName,
      total: fileUrls.length,
      fileUrls: fileUrls,
    };
  }

  public async getAllContainers(): Promise<any> {
    try {
      const blobService = this.getBlobServiceInstance();
      const containers = blobService.listContainers();
      const containerNames: string[] = [];

      for await (const container of containers) {
        containerNames.push(container.name);
      }

      return {
        total: containerNames.length,
        containerNames: containerNames,
      };
    } catch (error) {
      console.error('Error listing containers:', error);
      throw error;
    }
  }

  public async createContainer(containerName: string): Promise<string> {
    try {
      const blobService = this.getBlobServiceInstance();
      const containerClient = blobService.getContainerClient(containerName);

      await containerClient.createIfNotExists({
        access: 'blob',
      });

      console.log(`Container '${containerName}' created or already exists`);
      return `Container '${containerName}' is ready`;
    } catch (error) {
      console.error('Error creating container:', error);
      throw error;
    }
  }
}
