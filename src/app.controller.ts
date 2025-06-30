import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getAllFiles(@Query('container') container: string): Promise<any> {
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
    const fileUrl = await this.appService.uploadFile(file, container);
    return { url: fileUrl };
  }

  @Post('containers')
  async createContainer(
    @Body('name') containerName: string,
  ): Promise<{ message: string }> {
    const result = await this.appService.createContainer(containerName);
    return { message: result };
  }

  @Post('directory')
  async createDirectory(
    @Body('container') container: string,
    @Body('directory') directory: string,
  ): Promise<{ message: string }> {
    const result = await this.appService.createDirectory(container, directory);
    return { message: result };
  }

  @Get('directory')
  async listDirectory(
    @Query('container') container: string,
    @Query('directory') directory: string,
  ): Promise<{ blobs: string[]; directories: string[] }> {
    return await this.appService.listDirectory(container, directory);
  }

  @Get('directories')
  async listAllDirectories(
    @Query('container') container: string,
  ): Promise<{ directories: string[] }> {
    const directories = await this.appService.listAllDirectories(container);
    return { directories };
  }
}
