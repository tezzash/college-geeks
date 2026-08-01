import { Injectable } from '@nestjs/common';

export interface DomainEventBus {
  emit(eventName: string, payload: unknown): void;
}

@Injectable()
export class NoopDomainEventBus implements DomainEventBus {
  emit(): void {}
}
