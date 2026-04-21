import { Injectable } from '@nestjs/common';

@Injectable()
export class RevalidateService {
  private readonly baseUrl = 'http://localhost:3000';
  private readonly secret = process.env.NEXT_REVALIDATE_SECRET ?? '';

  async revalidatePath(path: string) {
    if (!this.secret) return;

    try {
      await fetch(`${this.baseUrl}/api/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-revalidate-secret': this.secret,
        },
        body: JSON.stringify({ path }),
      });
    } catch {
      // non-blocking
    }
  }
}