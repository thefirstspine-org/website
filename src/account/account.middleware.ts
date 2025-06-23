import { Injectable, NestMiddleware, Response } from '@nestjs/common';
import { AuthService } from '@thefirstspine/auth';

@Injectable()
export class AccountMiddleware implements NestMiddleware {

  private readonly authService = new AuthService();

  async use(req: any, @Response({passthrough: true}) res: any, next: () => void) {
    if (req.cookies.access_token) {
      const user = await this.authService.meFull(req.cookies.access_token);
      if (user) {
        req.userId = user.user_id; // @deprecated
        req.user = user;
      } else {
        res.cookie('access_token', null);
      }
    }
    next();
  }
}
