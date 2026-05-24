import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { IS_PUBLIC_KEY, Public, ROLES_KEY, Roles, PERMISSIONS_KEY, Permissions, CurrentUser } from './decorators';

describe('Public decorator', () => {
  it('sets metadata isPublic to true', () => {
    const fn = () => {};
    Public()(fn, 'test', undefined as any);
    const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, fn);
    expect(metadata).toBe(true);
  });
});

describe('Roles decorator', () => {
  it('sets metadata with single role', () => {
    const fn = () => {};
    Roles('admin')(fn, 'test', undefined as any);
    const metadata = Reflect.getMetadata(ROLES_KEY, fn);
    expect(metadata).toEqual(['admin']);
  });

  it('sets metadata with multiple roles', () => {
    const fn = () => {};
    Roles('admin', 'manager')(fn, 'test', undefined as any);
    const metadata = Reflect.getMetadata(ROLES_KEY, fn);
    expect(metadata).toEqual(['admin', 'manager']);
  });

  it('sets metadata with empty roles', () => {
    const fn = () => {};
    Roles()(fn, 'test', undefined as any);
    const metadata = Reflect.getMetadata(ROLES_KEY, fn);
    expect(metadata).toEqual([]);
  });
});

describe('Permissions decorator', () => {
  it('sets metadata with single permission', () => {
    const fn = () => {};
    Permissions('reports:read')(fn, 'test', undefined as any);
    const metadata = Reflect.getMetadata(PERMISSIONS_KEY, fn);
    expect(metadata).toEqual(['reports:read']);
  });

  it('sets metadata with multiple permissions', () => {
    const fn = () => {};
    Permissions('reports:read', 'users:write')(fn, 'test', undefined as any);
    const metadata = Reflect.getMetadata(PERMISSIONS_KEY, fn);
    expect(metadata).toEqual(['reports:read', 'users:write']);
  });

  it('sets metadata with empty permissions', () => {
    const fn = () => {};
    Permissions()(fn, 'test', undefined as any);
    const metadata = Reflect.getMetadata(PERMISSIONS_KEY, fn);
    expect(metadata).toEqual([]);
  });
});

describe('CurrentUser decorator', () => {
  function getFactory(decorator: Function) {
    class Test {
      testMethod(@decorator('email') _param: any) {}
    }
    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'testMethod');
    const key = Object.keys(metadata)[0];
    return metadata[key].factory;
  }

  function getFactoryNoData(decorator: Function) {
    class Test {
      testMethod(@decorator() _param: any) {}
    }
    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'testMethod');
    const key = Object.keys(metadata)[0];
    return metadata[key].factory;
  }

  const mockCtx = {
    switchToHttp: () => ({
      getRequest: () => ({ user: { id: 1, email: 'test@example.com', name: 'John' } }),
    }),
  } as any;

  it('returns the full user object when no data key is provided', () => {
    const factory = getFactoryNoData(CurrentUser);
    const result = factory(undefined, mockCtx);
    expect(result).toEqual({ id: 1, email: 'test@example.com', name: 'John' });
  });

  it('returns a specific user property when data key is provided', () => {
    const factory = getFactory(CurrentUser);
    const result = factory('email', mockCtx);
    expect(result).toBe('test@example.com');
  });

  it('returns undefined when requesting a non-existent property', () => {
    const factory = getFactory(CurrentUser);
    const result = factory('nonexistent', mockCtx);
    expect(result).toBeUndefined();
  });

  it('returns undefined when user is undefined', () => {
    const ctxNoUser = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as any;
    const factory = getFactoryNoData(CurrentUser);
    const result = factory(undefined, ctxNoUser);
    expect(result).toBeUndefined();
  });

  it('returns undefined by property when user is undefined', () => {
    const ctxNoUser = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as any;
    const factory = getFactory(CurrentUser);
    const result = factory('email', ctxNoUser);
    expect(result).toBeUndefined();
  });
});
