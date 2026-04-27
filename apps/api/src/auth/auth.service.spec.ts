import { UnauthorizedException } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  const usersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a JWT and user payload with role on successful login', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'admin@example.com',
      name: 'Admin User',
      passwordHash: 'hash',
      role: { name: RoleName.ADMIN },
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    jwtService.signAsync.mockResolvedValue('signed-token');

    const service = new AuthService(usersService as any, jwtService as any);

    await expect(
      service.login('admin@example.com', 'password'),
    ).resolves.toEqual({
      accessToken: 'signed-token',
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: RoleName.ADMIN,
      },
    });

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'admin@example.com',
      role: RoleName.ADMIN,
    });
  });

  it('rejects unknown emails without comparing passwords', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    const service = new AuthService(usersService as any, jwtService as any);

    await expect(service.login('missing@example.com', 'password')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('rejects invalid passwords', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'editor@example.com',
      name: 'Editor User',
      passwordHash: 'hash',
      role: { name: RoleName.EDITOR },
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const service = new AuthService(usersService as any, jwtService as any);

    await expect(service.login('editor@example.com', 'bad')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });
});
