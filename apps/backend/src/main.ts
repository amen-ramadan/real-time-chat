import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: true });

  await app.listen(process.env.PORT ?? 3003);
  console.log('Backend running on http://localhost:3003');
}
bootstrap();
