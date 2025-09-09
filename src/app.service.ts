import { Injectable } from '@nestjs/common';
import { BlobServiceClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';

const connectionStringEnv = '';

@Injectable()
export class AppService {
  private blobService?: BlobServiceClient;

  private getBlobServiceInstance() {
    if (!this.blobService) {
      if (!connectionStringEnv) {
        throw new Error('AZURE_STORAGE_CONNECTION_STRING no configurado');
      }
      this.blobService =
        BlobServiceClient.fromConnectionString(connectionStringEnv);
    }
    return this.blobService;
  }

  private normalizePrefix(prefix?: string): string | undefined {
    if (!prefix || prefix === '/') return undefined; // sin prefijo => todo el contenedor
    return prefix.endsWith('/') ? prefix : `${prefix}/`;
  }

  public async uploadFile(
    file: Express.Multer.File,
    containerName: string,
  ): Promise<string> {
    const service = this.getBlobServiceInstance();
    const containerClient = service.getContainerClient(containerName);

    const extension = (file.originalname.split('.').pop() || '').trim();
    const fileName = `${uuidv4()}${extension ? '.' + extension : ''}`;

    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype || 'application/octet-stream',
      },
    });
    return blockBlobClient.url;
  }

  public async getAllFile(containerName: string): Promise<any> {
    const service = this.getBlobServiceInstance();
    const containerClient = service.getContainerClient(containerName);
    const blobs = containerClient.listBlobsFlat();
    const fileUrls: string[] = [];

    for await (const blob of blobs) {
      const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
      fileUrls.push(blockBlobClient.url);
    }

    return { containerName, total: fileUrls.length, fileUrls };
  }

  public async getAllContainers(): Promise<any> {
    const service = this.getBlobServiceInstance();
    const containers = service.listContainers();
    const containerNames: string[] = [];
    for await (const c of containers) containerNames.push(c.name);
    return { total: containerNames.length, containerNames };
  }

  public async createContainer(containerName: string): Promise<string> {
    const service = this.getBlobServiceInstance();
    const containerClient = service.getContainerClient(containerName);
    await containerClient.createIfNotExists({ access: 'blob' });
    return `Container '${containerName}' is ready`;
  }

  public async createDirectory(
    containerName: string,
    directoryName: string,
  ): Promise<string> {
    const service = this.getBlobServiceInstance();
    const containerClient = service.getContainerClient(containerName);
    const dirName = directoryName.endsWith('/')
      ? directoryName
      : `${directoryName}/`;
    const blockBlobClient = containerClient.getBlockBlobClient(dirName);
    await blockBlobClient.upload('', 0);
    return `Directorio '${dirName}' creado en el contenedor '${containerName}'`;
  }

  public async listDirectory(
    containerName: string,
    directoryName: string,
  ): Promise<{ blobs: string[]; directories: string[] }> {
    const service = this.getBlobServiceInstance();
    const containerClient = service.getContainerClient(containerName);
    const prefix = this.normalizePrefix(directoryName) || '';
    const iter = containerClient.listBlobsByHierarchy('/', { prefix });
    const blobs: string[] = [];
    const directories: string[] = [];
    for await (const item of iter) {
      if (item.kind === 'prefix') directories.push(item.name);
      else blobs.push(item.name);
    }
    return { blobs, directories };
  }

  public async listAllDirectories(containerName: string): Promise<string[]> {
    const service = this.getBlobServiceInstance();
    const containerClient = service.getContainerClient(containerName);
    const allDirs: Set<string> = new Set();

    const walk = async (prefix: string) => {
      const iter = containerClient.listBlobsByHierarchy('/', { prefix });
      for await (const item of iter) {
        if (item.kind === 'prefix') {
          allDirs.add(item.name);
          await walk(item.name);
        }
      }
    };

    await walk('');
    return Array.from(allDirs).sort();
  }

  public async countExtensionInPrefix(
    containerName: string,
    extension: string,
    prefix?: string,
  ): Promise<{ container: string; prefix?: string; count: number }> {
    const service = this.getBlobServiceInstance();
    const containerClient = service.getContainerClient(containerName);

    const normalizedPrefix = this.normalizePrefix(prefix);
    let count = 0;

    for await (const blob of containerClient.listBlobsFlat({
      prefix: normalizedPrefix,
    })) {
      if (blob.name.toLowerCase().endsWith(extension)) count++;
    }

    return { container: containerName, prefix: normalizedPrefix, count };
  }
}
