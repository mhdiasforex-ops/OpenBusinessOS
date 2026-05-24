import { TenantMiddleware, tenantContext } from './tenant.middleware';

describe('TenantMiddleware', () => {
  let middleware: TenantMiddleware;
  let mockNext: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    middleware = new TenantMiddleware();
    mockNext = vi.fn();
  });

  it('extracts orgId from req.user.organizationId and runs context', () => {
    const req = { user: { organizationId: 'org-from-user' }, headers: {} };
    const runSpy = vi.spyOn(tenantContext, 'run');

    middleware.use(req, {}, mockNext);

    expect(runSpy).toHaveBeenCalledWith(
      { organizationId: 'org-from-user' },
      expect.any(Function),
    );
    expect(mockNext).toHaveBeenCalled();
  });

  it('extracts orgId from x-organization-id header when user.organizationId is absent', () => {
    const req = { user: {}, headers: { 'x-organization-id': 'org-from-header' } };
    const runSpy = vi.spyOn(tenantContext, 'run');

    middleware.use(req, {}, mockNext);

    expect(runSpy).toHaveBeenCalledWith(
      { organizationId: 'org-from-header' },
      expect.any(Function),
    );
    expect(mockNext).toHaveBeenCalled();
  });

  it('prefers req.user.organizationId over header when both exist', () => {
    const req = {
      user: { organizationId: 'org-from-user' },
      headers: { 'x-organization-id': 'org-from-header' },
    };
    const runSpy = vi.spyOn(tenantContext, 'run');

    middleware.use(req, {}, mockNext);

    expect(runSpy).toHaveBeenCalledWith(
      { organizationId: 'org-from-user' },
      expect.any(Function),
    );
  });

  it('calls next() without running context when no orgId is found', () => {
    const req = { user: {}, headers: {} };
    const runSpy = vi.spyOn(tenantContext, 'run');

    middleware.use(req, {}, mockNext);

    expect(runSpy).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });

  it('calls next() when user is undefined and no header', () => {
    const req = { headers: {} };
    const runSpy = vi.spyOn(tenantContext, 'run');

    middleware.use(req, {}, mockNext);

    expect(runSpy).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });

  it('calls next() when user is null and no header', () => {
    const req = { user: null, headers: {} };
    const runSpy = vi.spyOn(tenantContext, 'run');

    middleware.use(req, {}, mockNext);

    expect(runSpy).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });

  it('invokes the run callback which calls next()', () => {
    const req = { user: { organizationId: 'org-1' }, headers: {} };
    const result: string[] = [];
    vi.spyOn(tenantContext, 'run').mockImplementation((_store, callback) => {
      result.push('callback-called');
      callback();
    });

    middleware.use(req, {}, mockNext);

    expect(result).toContain('callback-called');
    expect(mockNext).toHaveBeenCalled();
  });

  it('passes errors from next() through the middleware chain', () => {
    const req = { user: {}, headers: {} };
    const expectedError = new Error('db-error');
    const errorNext = vi.fn(() => { throw expectedError; });

    expect(() => middleware.use(req, {}, errorNext)).toThrow('db-error');
  });
});
