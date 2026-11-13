import { Resend, type ErrorResponse } from "resend";

// Invitations are sent with Resend from the verified getbookedandbusy.app
// domain. The API key comes from the RESEND_API_KEY environment variable and
// is only ever used on the server.
export const INVITATION_FROM = "Booked and Busy <invitations@getbookedandbusy.app>";

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function createResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

// Turns a Resend error into a message a host can act on. The full error is
// logged on the server for debugging.
export function describeEmailError(error: ErrorResponse) {
  switch (error.name) {
    case "missing_api_key":
    case "invalid_api_key":
    case "restricted_api_key":
      return "Email sending isn't set up correctly (API key problem).";
    case "invalid_from_address":
      return "The sending address isn't verified with Resend yet.";
    case "rate_limit_exceeded":
      return "Too many emails at once. Please wait a minute and try again.";
    case "daily_quota_exceeded":
    case "monthly_quota_exceeded":
      return "The email sending limit has been reached. Please try again later.";
    case "validation_error":
    case "invalid_parameter":
    case "missing_required_field":
      return `Resend couldn't send this email: ${error.message}`;
    default:
      return "Something went wrong sending the invitations. Please try again.";
  }
}
