import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model";
import { EmailAlreadyExistsError, InvalidCredentialsError } from "../errors";

const SALT_ROUNDS = 10;

export async function createUser(email: string, password: string) {
  const existing = await User.findOne({ email });
  if (existing) throw new EmailAlreadyExistsError(email);

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  return User.create({ email, passwordHash });
}

export async function verifyCredentials(email: string, password: string) {
  const user = await User.findOne({ email });
  if (!user) throw new InvalidCredentialsError();

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) throw new InvalidCredentialsError();

  return user;
}

export function generateToken(userId: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.sign({ sub: userId }, secret, { expiresIn: "7d" });
}
