import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { LogsService } from '@thefirstspine/logs-nest';
import { Response } from 'express';

@Catch()
export class ErrorFilter implements ExceptionFilter {
  constructor(
    private readonly logsService: LogsService,
  ) {}

  catch(exception: HttpException & Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status: number = 500;
    if ( typeof exception.getStatus === 'function') {
      status = exception.getStatus();
    }
    if (status >= 500) {
      this.logsService.error(
        `Global error with status ${status}`, {
          message: exception.message,
          name: exception.name,
          stack: exception.stack,
        });
    } else {
      this.logsService.warning(
        `Global warning with status ${status}`, {
          message: exception.message,
          name: exception.name,
          stack: exception.stack,
        });
    }

    response.render('error');
  }
}