import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getAllFiles(@Query('container') container: string): Promise<any> {
    if (!container) throw new BadRequestException('container es requerido');
    return await this.appService.getAllFile(container);
  }

  @Get('containers')
  async getAllContainers(): Promise<any> {
    return await this.appService.getAllContainers();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('container') container: string,
  ): Promise<{ url: string }> {
    if (!container) throw new BadRequestException('container es requerido');
    if (!file) throw new BadRequestException('file es requerido');
    const fileUrl = await this.appService.uploadFile(file, container);
    return { url: fileUrl };
  }

  @Post('containers')
  async createContainer(
    @Body('name') containerName: string,
  ): Promise<{ message: string }> {
    if (!containerName) throw new BadRequestException('name es requerido');
    const result = await this.appService.createContainer(containerName);
    return { message: result };
  }

  @Post('directory')
  async createDirectory(
    @Body('container') container: string,
    @Body('directory') directory: string,
  ): Promise<{ message: string }> {
    if (!container || !directory) {
      throw new BadRequestException('container y directory son requeridos');
    }
    const result = await this.appService.createDirectory(container, directory);
    return { message: result };
  }

  @Get('directory')
  async listDirectory(
    @Query('container') container: string,
    @Query('directory') directory: string,
  ): Promise<{ blobs: string[]; directories: string[] }> {
    if (!container || !directory) {
      throw new BadRequestException('container y directory son requeridos');
    }
    return await this.appService.listDirectory(container, directory);
  }

  @Get('directories')
  async listAllDirectories(
    @Query('container') container: string,
  ): Promise<{ directories: string[] }> {
    if (!container) throw new BadRequestException('container es requerido');
    const directories = await this.appService.listAllDirectories(container);
    return { directories };
  }

  @Get('count-parquet')
  async countParquet(
    @Query('container') container: string,
    @Query('extension') extension: string,
    @Query('prefix') prefix?: string,
  ): Promise<{ container: string; prefix?: string; count: number }> {
    if (!container) throw new BadRequestException('container es requerido');
    return await this.appService.countExtensionInPrefix(
      container,
      extension,
      prefix,
    );
  }
}
