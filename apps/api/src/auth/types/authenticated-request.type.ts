export type AuthenticatedRequest = {
  user: {
    email: string;
    id: string;
    name: string;
    role: string;
  };
};
