// Declaraciones de tipos para el editor (VS Code / Antigravity).
// En Supabase, Deno y @supabase/supabase-js ya están provistos nativamente por el entorno.

declare module 'npm:@supabase/supabase-js@2' {
  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: Record<string, unknown>
  ): {
    auth: {
      getUser(): Promise<{ data: { user: unknown }; error: unknown }>;
    };
    rpc(
      fn: string,
      args?: Record<string, unknown>
    ): Promise<{ data: unknown; error: unknown }>;
  };
}

declare module '@supabase/supabase-js' {
  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: Record<string, unknown>
  ): {
    auth: {
      getUser(): Promise<{ data: { user: unknown }; error: unknown }>;
    };
    rpc(
      fn: string,
      args?: Record<string, unknown>
    ): Promise<{ data: unknown; error: unknown }>;
  };
}

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

