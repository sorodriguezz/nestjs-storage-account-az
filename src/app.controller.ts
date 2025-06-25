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
}
