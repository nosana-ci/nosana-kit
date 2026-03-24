/**
 * Client Manager API Schema
 *
 * Manually maintained — no swagger available for this service yet.
 * Derived from Elysia route definitions and model types in clients/client-manager/src/.
 */

export interface paths {
  // ── Auth ──────────────────────────────────────────────────────────────
  '/auth/validate-session': {
    post: {
      requestBody?: {
        content: {
          'application/json': {
            cookieHeader?: string;
          };
        };
      };
      responses: {
        200: {
          content: {
            'application/json': {
              valid: boolean;
              user?: components['schemas']['UserWithAuth'];
              session?: {
                handle?: string;
                expiresAt?: string;
              };
            };
          };
        };
      };
    };
  };
  '/auth/validate-api-key': {
    post: {
      requestBody: {
        content: {
          'application/json': {
            apiKey: string;
          };
        };
      };
      responses: {
        200: {
          content: {
            'application/json': {
              valid: boolean;
              user?: components['schemas']['UserWithAuth'];
              apiKeyId?: string;
            };
          };
        };
      };
    };
  };
  '/auth/sign-message/external': {
    post: {
      requestBody: {
        content: {
          'application/json': {
            message: string;
            includeTime?: boolean;
          };
        };
      };
      responses: {
        200: {
          content: {
            'application/json': {
              signature: string;
              message: string;
              userAddress: string;
              timestamp?: number;
            };
          };
        };
        401: {
          content: {
            'application/json': {
              name: string;
              message: string;
            };
          };
        };
      };
    };
  };

  // ── User ──────────────────────────────────────────────────────────────
  '/user/profile': {
    get: {
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['UserProfile'];
          };
        };
      };
    };
  };

  // ── API Keys ──────────────────────────────────────────────────────────
  '/api-keys/': {
    get: {
      responses: {
        200: {
          content: {
            'application/json': {
              keys: components['schemas']['ApiKey'][];
              total: number;
            };
          };
        };
      };
    };
    post: {
      requestBody: {
        content: {
          'application/json': {
            name: string;
            expiresIn?: number;
          };
        };
      };
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['ApiKeyCreated'];
          };
        };
      };
    };
  };
  '/api-keys/{id}': {
    get: {
      parameters: {
        path: {
          id: string;
        };
        query?: undefined;
        cookie?: undefined;
      };
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['ApiKey'];
          };
        };
      };
    };
  };
  '/api-keys/{id}/update': {
    post: {
      parameters: {
        path: {
          id: string;
        };
        query?: undefined;
        cookie?: undefined;
      };
      requestBody: {
        content: {
          'application/json': {
            name?: string;
            status?: 'active' | 'disabled';
          };
        };
      };
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['ApiKey'];
          };
        };
      };
    };
  };
  '/api-keys/{id}/delete': {
    post: {
      parameters: {
        path: {
          id: string;
        };
        query?: undefined;
        cookie?: undefined;
      };
      responses: {
        200: {
          content: {
            'application/json': {
              success: boolean;
            };
          };
        };
      };
    };
  };

  // ── Credits ───────────────────────────────────────────────────────────
  '/credits/balance': {
    get: {
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['CreditBalance'];
          };
        };
      };
    };
  };
  '/credits/claim': {
    post: {
      requestBody: {
        content: {
          'application/json': {
            code: string;
          };
        };
      };
      responses: {
        200: {
          content: {
            'application/json': Record<string, unknown>;
          };
        };
      };
    };
  };
  '/credits/request': {
    post: {
      responses: {
        200: {
          content: {
            'application/json': Record<string, unknown>;
          };
        };
      };
    };
  };
  '/credits/request/eligibility': {
    get: {
      responses: {
        200: {
          content: {
            'application/json': Record<string, unknown>;
          };
        };
      };
    };
  };
  '/credits/invitations/{token}': {
    get: {
      parameters: {
        path: {
          token: string;
        };
        query?: undefined;
        cookie?: undefined;
      };
      responses: {
        200: {
          content: {
            'application/json': Record<string, unknown>;
          };
        };
      };
    };
  };
  '/credits/invitations/{token}/claim': {
    post: {
      parameters: {
        path: {
          token: string;
        };
        query?: undefined;
        cookie?: undefined;
      };
      responses: {
        200: {
          content: {
            'application/json': Record<string, unknown>;
          };
        };
      };
    };
  };

  // ── Jobs (credits-based) ──────────────────────────────────────────────
  '/jobs/list': {
    post: {
      requestBody: {
        content: {
          'application/json': {
            ipfsHash: string;
            market: string;
            timeout?: number;
            node?: string;
          };
        };
      };
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['CreateJobWithCreditsResponse'];
          };
        };
      };
    };
  };
  '/jobs/{address}/extend': {
    post: {
      parameters: {
        path: {
          address: string;
        };
        query?: undefined;
        cookie?: undefined;
      };
      requestBody: {
        content: {
          'application/json': {
            seconds: number;
          };
        };
      };
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['ExtendJobWithCreditsResponse'];
          };
        };
      };
    };
  };
  '/jobs/{address}/stop': {
    post: {
      parameters: {
        path: {
          address: string;
        };
        query?: undefined;
        cookie?: undefined;
      };
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['StopJobWithCreditsResponse'];
          };
        };
      };
    };
  };

  // ── Templates ─────────────────────────────────────────────────────────
  '/templates/': {
    get: {
      responses: {
        200: {
          content: {
            'application/json': Record<string, unknown>[];
          };
        };
      };
    };
  };
  '/templates/grouped': {
    get: {
      responses: {
        200: {
          content: {
            'application/json': Record<string, unknown>;
          };
        };
      };
    };
  };
  '/templates/{id}': {
    get: {
      parameters: {
        path: {
          id: string;
        };
        query?: undefined;
        cookie?: undefined;
      };
      responses: {
        200: {
          content: {
            'application/json': Record<string, unknown>;
          };
        };
      };
    };
  };
  '/templates/{id}/{variantId}': {
    get: {
      parameters: {
        path: {
          id: string;
          variantId: string;
        };
        query?: undefined;
        cookie?: undefined;
      };
      responses: {
        200: {
          content: {
            'application/json': Record<string, unknown>;
          };
        };
      };
    };
  };

  // ── Tracker (admin) ───────────────────────────────────────────────────
  '/tracker/': {
    get: {
      responses: {
        200: {
          content: {
            'application/json': Record<string, unknown>[];
          };
        };
      };
    };
    post: {
      requestBody: {
        content: {
          'application/json': {
            name: string;
            wallet: string;
            minimumUsd: number;
            minimumSol: number;
          };
        };
      };
      responses: {
        200: {
          content: {
            'application/json': Record<string, unknown>;
          };
        };
      };
    };
  };
  '/tracker/{name}/update': {
    post: {
      parameters: {
        path: {
          name: string;
        };
        query?: undefined;
        cookie?: undefined;
      };
      requestBody: {
        content: {
          'application/json': {
            wallet?: string;
            minimumUsd?: number;
            minimumSol?: number;
          };
        };
      };
      responses: {
        200: {
          content: {
            'application/json': Record<string, unknown>;
          };
        };
      };
    };
  };
  '/tracker/{name}/delete': {
    post: {
      parameters: {
        path: {
          name: string;
        };
        query?: undefined;
        cookie?: undefined;
      };
      responses: {
        200: {
          content: {
            'application/json': Record<string, unknown>;
          };
        };
      };
    };
  };

  // ── Health ────────────────────────────────────────────────────────────
  '/health': {
    get: {
      responses: {
        200: {
          content: {
            'application/json': {
              status: string;
              mode: string;
              timestamp: string;
            };
          };
        };
      };
    };
  };
}

export interface components {
  schemas: {
    UserProfile: {
      id: string;
      email: string | null;
      name: string | null;
      providerUsername: string | null;
      generatedAddress: string | null;
      loginMethod: string | null;
    };
    UserWithAuth: {
      id: string;
      supertokensUserId?: string | null;
      legacyUserId: string | null;
      email: string;
      name: string | null;
      provider: string | null;
      providerUsername: string | null;
      generatedAddress: string;
      authenticationHeader: string;
      systemApiKey: string;
      created_at: string | null;
    };
    ApiKey: {
      id: string;
      name: string;
      key: string;
      status: string;
      lastUsedAt: string | null;
      expiresAt: string | null;
      createdAt: string;
      updatedAt: string;
    };
    ApiKeyCreated: {
      key: string;
      id: string;
      name: string;
      status: string;
      expiresAt: string | null;
      createdAt: string;
    };
    CreditBalance: {
      assignedCredits: number;
      reservedCredits: number;
      settledCredits: number;
    };
    CreateJobWithCreditsResponse: {
      tx: string;
      job: string;
      run: string;
      credits: {
        costUSD: number;
        creditsUsed: number;
        reservationId: string;
        project: string;
      };
    };
    ExtendJobWithCreditsResponse: {
      tx: string;
      job: string;
      credits: {
        costUSD: number;
        creditsUsed: number;
        reservationId: string;
      };
    };
    StopJobWithCreditsResponse: {
      tx: string;
      job: string;
      delisted: boolean;
    };
  };
}
