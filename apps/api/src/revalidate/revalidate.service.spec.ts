import { RevalidateService } from './revalidate.service';

describe('RevalidateService', () => {
  const originalSecret = process.env.NEXT_REVALIDATE_SECRET;
  const originalFetch = global.fetch;
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as any;
  });

  afterEach(() => {
    process.env.NEXT_REVALIDATE_SECRET = originalSecret;
    global.fetch = originalFetch;
  });

  it('does not call Next.js revalidate API when secret is missing', async () => {
    delete process.env.NEXT_REVALIDATE_SECRET;
    const service = new RevalidateService();

    await service.revalidatePath('/tr/products');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts the path with the configured secret and ignores fetch failures', async () => {
    process.env.NEXT_REVALIDATE_SECRET = 'secret';
    fetchMock.mockRejectedValue(new Error('offline'));
    const service = new RevalidateService();

    await expect(service.revalidatePath('/tr/products')).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/revalidate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-revalidate-secret': 'secret',
        },
        body: JSON.stringify({ path: '/tr/products' }),
      },
    );
  });
});
