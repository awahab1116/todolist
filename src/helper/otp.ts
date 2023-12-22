export const generateOtp = () => {
  const otp = Math.floor(100000 + Math.random() * 900000);

  const otpExpirationTime = new Date(Date.now() + 15 * 60 * 1000); // in milliseconds
  console.log("OTP: ", otp);
  console.log("Expiration Time: ", otpExpirationTime);
  return { otp, otpExpirationTime };
};
