export const SATISFACTION_SURVEY_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScX3kBrUUPwrUeQ_9HwwnzL026YirT5x26-Y91TTVZSpTNcxw/viewform?usp=dialog';

export function openSatisfactionSurvey() {
  window.open(SATISFACTION_SURVEY_URL, '_blank', 'noopener,noreferrer');
}
