import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../../database/redis.service';
import Redis from 'ioredis';

/**
 * Real-Time Analytics Gateway.
 * Subscribes to Redis pub/sub 'click-feed' channel and broadcasts
 * to connected WebSocket clients filtered by workspace.
 */
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/analytics' })
export class AnalyticsGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(AnalyticsGateway.name);
  private subscriber: Redis;

  constructor(private redis: RedisService) {}

  afterInit() {
    // Create a separate Redis subscriber connection
    this.subscriber = this.redis.client.duplicate();
    this.subscriber.subscribe('click-feed');
    this.subscriber.on('message', (channel, message) => {
      if (channel === 'click-feed') {
        try {
          const event = JSON.parse(message);
          // Broadcast to workspace-specific room
          this.server.to(`ws:${event.workspaceId}`).emit('click', event);
        } catch (err) {
          this.logger.error('Failed to parse click feed message', err);
        }
      }
    });
    this.logger.log('Analytics WebSocket gateway initialized');
  }

  handleConnection(client: Socket) {
    const workspaceId = client.handshake.query.workspaceId as string;
    if (workspaceId) {
      client.join(`ws:${workspaceId}`);
      this.logger.log(`Client ${client.id} joined workspace ${workspaceId}`);
    }
  }
}
