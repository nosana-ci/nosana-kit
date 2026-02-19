export type DockerAuth = {
  username?: string;
  password?: string;
  email?: string;
  server?: string;
};

export type Authentication = {
  docker?: DockerAuth;
}