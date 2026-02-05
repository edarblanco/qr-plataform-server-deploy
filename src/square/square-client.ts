import { SquareClient, SquareEnvironment } from 'square';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();

export const squareClient = new SquareClient({
  environment:
    configService.get('SQUARE_ENVIRONMENT') === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
  token: configService.get('SQUARE_ACCESS_TOKEN') || '',
});
