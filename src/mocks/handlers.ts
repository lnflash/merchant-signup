import { rest } from 'msw';

type HandlerContext = any;
type RestRequest = any;
type ResponseResolver = any;

// Define handlers for API endpoints
export const handlers = [
  // Health check endpoint
  rest.get('/api/health', (req: RestRequest, res: ResponseResolver, ctx: HandlerContext) => {
    return res(
      ctx.status(200),
      ctx.json({
        status: 'healthy',
        version: '0.2.0',
        timestamp: new Date().toISOString(),
      })
    );
  }),

  // Submit form endpoint
  rest.post('/api/submit', async (req: RestRequest, res: ResponseResolver, ctx: HandlerContext) => {
    const body = await req.json();

    // Simulate validation
    if (!body.name || !body.phone) {
      return res(
        ctx.status(400),
        ctx.json({
          success: false,
          error: 'Name and phone are required fields',
        })
      );
    }

    // Simulate successful submission
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Signup successful',
        data: {
          id: 'mock-id-12345',
          created_at: new Date().toISOString(),
        },
      })
    );
  }),
];
