import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ok } from '../utils/response';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Default message
    let message: any = 'Internal server error';

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (res && typeof res === 'object') {
        // common shape: { message: '...', error: 'Bad Request' } or { message: [ ... ] }
        if ((res as any).message) {
          message = (res as any).message;
        } else if ((res as any).error) {
          message = (res as any).error;
        } else {
          message = res;
        }
      }

      // Normalize arrays
      if (Array.isArray(message)) {
        message = (message as any[]).join('; ');
      }

      // Translate common validation error phrases to Vietnamese
      const translate = (msg: string) => {
        if (!msg) return msg;
        let t = String(msg);
        // common replacements
        t = t.replace(/should not be empty/gi, 'Không được để trống');
        t = t.replace(/must be one of the following values:?\s*(.*)$/i, (_m, g1) => `Phải là một trong các giá trị sau: ${g1}`);
        t = t.replace(/must be an email/gi, 'Email không hợp lệ');
        t = t.replace(/must be longer than or equal to (\d+) characters/gi, (_m, g1) => `Phải có ít nhất ${g1} ký tự`);
        t = t.replace(/must be a string/gi, 'Phải là chuỗi ký tự');
        t = t.replace(/must be a well-formed hexadecimal string/gi, 'Chuỗi không hợp lệ');
        t = t.replace(/must be a number conforming to the specified constraints/gi, 'Giá trị phải là số hợp lệ');
        t = t.replace(/email must be an email/gi, 'Email không hợp lệ');
        t = t.replace(/gender must be one of the following values:?\s*(.*)$/gi, (_m, g1) => `Giới tính phải là một trong: ${g1}`);
        // generic: translate 'must be' to 'phải' when appropriate
        t = t.replace(/\bmust\b/gi, 'phải');

        // Replace common token values to Vietnamese equivalents
        t = t.replace(/\bmale\b/gi, 'Nam');
        t = t.replace(/\bfemale\b/gi, 'Nữ');
        t = t.replace(/\bother\b/gi, 'Khác');

        // Map workflow/status keys if they appear in messages
        t = t.replace(/\bnew\b/gi, 'Khách mới');
        t = t.replace(/\bappointment\b/gi, 'Hẹn khách');
        t = t.replace(/\bsales\b/gi, 'Tư vấn bán hàng');
        t = t.replace(/\bdeposit_form\b/gi, 'Viết phiếu cọc');
        t = t.replace(/\bcontract\b/gi, 'Ký hợp đồng');
        t = t.replace(/\bfailed\b/gi, 'Thất bại');
        return t;
      };

      try {
        message = translate(String(message));
      } catch (e) {
        // fallback: leave original
      }

      // Use the actual exception status
      return response.status(status).json({
        success: false,
        data: null,
        message: message, // Flatten message to top level or keep in data? Standard is usually separate
        error: res
      });
    }

    // Non-HTTP exceptions (unexpected)
    console.error('Unexpected error at', request.url, exception);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
