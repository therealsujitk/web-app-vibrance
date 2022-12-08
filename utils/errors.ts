export class ClientError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidCredentials extends ClientError {
  constructor() {
    super("Invalid username / password");
  }
}
