import moment from "moment";

//Function to check if date is valid or not
export const IsDateValid = (date: string): boolean => {
  const checkDate = moment(date, "YYYY-MM-DDTHH:mm:ss", true);
  return checkDate.isValid();
};
