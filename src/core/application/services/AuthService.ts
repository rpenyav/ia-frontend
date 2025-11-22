// src/core/services/auth/AuthService.ts

import { setAuthToken } from "../../../infrastructure/config/env";
import type { AuthRepository } from "../../../infrastructure/repositories";
import type { LoginRequest, LoginResponse } from "../../../interfaces";

export class AuthService {
  private readonly repository: AuthRepository;

  constructor(repository: AuthRepository) {
    this.repository = repository;
  }

  async login(body: LoginRequest): Promise<LoginResponse> {
    const res = await this.repository.login(body);
    setAuthToken(res.accessToken);
    return res;
  }

  logout(): void {
    setAuthToken(null);
  }
}
