import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Restrict CORS for production, allow specific origin or fallback for development
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000'; // Assuming frontend runs on 3000
  app.enableCors({
    origin: clientUrl,
    credentials: true, // If you need to send cookies or authorization headers
  });

  await app.listen(process.env.PORT ?? 3003);
  console.log(`Backend running on port ${process.env.PORT ?? 3003}, accepting requests from ${clientUrl}`);
}
bootstrap();
