import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS habilitado para que el frontend (Vite, otro puerto) pueda consumir la API.
  app.enableCors();

  // whitelist: descarta propiedades no declaradas en los DTOs.
  // transform: convierte automáticamente los tipos (ej: params de rutas a number).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`RP Virtual backend corriendo en http://localhost:${port}/api`);
}
bootstrap();
