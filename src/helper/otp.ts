//function to generate otp with its expiration time which is 15 minutes
export const generateOtp = () => {
  const otp = Math.floor(100000 + Math.random() * 900000);

  const otpExpirationTime = new Date(Date.now() + 15 * 60 * 1000); // in milliseconds
  return { otp, otpExpirationTime };
};
