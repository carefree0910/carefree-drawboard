declare global {
  interface Window {
    _env_: {
      CFDRAW_BE_PORT: string;
      CFDRAW_API_URL: string;
      CFDRAW_ALLOWED_ORIGINS: string;
    };
  }
}

export {};
