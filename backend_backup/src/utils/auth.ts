import bcrypt from 'bcrypt';

export const hashPin = async (pin: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pin, salt);
};

export const verifyPin = async (pin: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(pin, hash);
}; 