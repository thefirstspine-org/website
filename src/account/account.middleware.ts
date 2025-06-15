import { Injectable, NestMiddleware } from '@nestjs/common';
import { AuthService } from '@thefirstspine/auth';

@Injectable()
export class AccountMiddleware implements NestMiddleware {

  private readonly authService = new AuthService();

  async use(req: any, res: any, next: () => void) {
    if (req.session.access_token) {
      const userId = await this.authService.me((req.session as any).access_token);
      if (userId) {
        req.userId = userId;
      } else {
        req.session.access_token = null;
      }
    }
    next();
  }
}
