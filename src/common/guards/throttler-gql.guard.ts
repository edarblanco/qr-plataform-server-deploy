import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

/**
 * Custom ThrottlerGuard que maneja tanto HTTP REST como GraphQL
 *
 * El ThrottlerGuard por defecto solo funciona con HTTP REST.
 * Este guard extiende la funcionalidad para extraer el request
 * correctamente del contexto de GraphQL y manejar la extracción
 * del IP de manera segura.
 */
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  /**
   * Sobrescribe getRequestResponse para manejar tanto HTTP como GraphQL
   */
  getRequestResponse(context: ExecutionContext) {
    // Primero intentar obtener contexto GraphQL
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();

    // Si hay un contexto GraphQL con req, usarlo
    if (ctx && ctx.req) {
      const req = ctx.req;
      let res = ctx.res;

      // Asegurarse de que el request tenga el método header() si no lo tiene
      if (!req.header && req.headers) {
        req.header = function(name: string) {
          return this.headers[name.toLowerCase()];
        };
      }

      // Si res no existe o no tiene el método header(), crear un mock
      if (!res || !res.header) {
        res = {
          header: (name: string, value: any) => {
            // En GraphQL no podemos establecer headers de respuesta de la misma manera
            // pero necesitamos el método para que el ThrottlerGuard no falle
            return res;
          },
          // Agregar otros métodos comunes de response que podrían ser necesarios
          setHeader: (name: string, value: any) => res,
          getHeader: (name: string) => undefined,
          removeHeader: (name: string) => res,
        };
      }

      return { req, res };
    }

    // Si no es GraphQL, usar el comportamiento por defecto (HTTP REST)
    return super.getRequestResponse(context);
  }

  /**
   * Sobrescribe getTracker para extraer el IP de manera segura
   * tanto de HTTP como de GraphQL
   */
  protected async getTracker(req: Request): Promise<string> {
    // Intentar obtener IP de diferentes fuentes
    // 1. X-Forwarded-For header (proxy/load balancer)
    const forwardedFor = req.headers?.['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      return ips.split(',')[0].trim();
    }

    // 2. X-Real-IP header (nginx)
    const realIp = req.headers?.['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    // 3. req.ip (Express)
    if (req.ip) {
      return req.ip;
    }

    // 4. req.connection o req.socket (fallback)
    const connection = (req as any).connection;
    const socket = (req as any).socket;
    if (connection?.remoteAddress) {
      return connection.remoteAddress;
    }
    if (socket?.remoteAddress) {
      return socket.remoteAddress;
    }

    // 5. Fallback a localhost si no se puede determinar
    return '127.0.0.1';
  }
}
