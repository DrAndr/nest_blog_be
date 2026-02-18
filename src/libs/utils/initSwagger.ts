import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export default class {
  constructor(protected app: INestApplication) {
    this.app = app;
    this.init();
  }

  private init(): void {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Advanced backend practice')
      .setDescription('The REST API documentation')
      .setVersion('1.0.0')
      // .addTag('Site API Docs')
      .build();

    const document = SwaggerModule.createDocument(this.app, swaggerConfig);
    SwaggerModule.setup('/api/docs', this.app, document);
  }
}
